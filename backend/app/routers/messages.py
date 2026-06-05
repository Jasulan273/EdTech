import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db, SessionLocal
from ..models import Chat, Message
from ..schemas import SendMessageIn
from ..services import context

router = APIRouter(prefix="/chats", tags=["messages"])


@router.post("/{chat_id}/messages")
async def send_message(
    chat_id: int,
    body: SendMessageIn,
    db: Session = Depends(get_db),
):
    chat = db.get(Chat, chat_id)
    if not chat:
        raise HTTPException(404, "Chat not found")

    is_first = not chat.messages

    db.add(Message(chat_id=chat_id, role="user", content=body.content))
    db.commit()

    async def event_stream():
        inner_db = SessionLocal()
        try:
            inner_chat = inner_db.get(Chat, chat_id)
            if inner_chat is None:
                return

            if is_first:
                title = await context.generate_title(body.content)
                inner_chat.title = title
                inner_db.commit()
                yield f"data: {json.dumps({'type': 'title', 'content': title})}\n\n"

            llm_messages = context.build_llm_messages(inner_chat)
            chunks: list[str] = []

            async for chunk in context.llm.stream_completion(llm_messages):
                chunks.append(chunk)
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

            inner_db.add(Message(chat_id=chat_id, role="assistant", content="".join(chunks)))
            inner_db.commit()
            inner_db.refresh(inner_chat)

            await context.compress_if_needed(inner_chat, inner_db)

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            inner_db.close()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
