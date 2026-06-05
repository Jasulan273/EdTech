from sqlalchemy.orm import Session
from ..models import Chat, Message
from ..config import settings
from . import llm


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def build_llm_messages(chat: Chat) -> list[dict]:
    system = "You are a helpful assistant."
    if chat.context_summary:
        system += f"\n\nEarlier conversation summary:\n{chat.context_summary}"
    return [
        {"role": "system", "content": system},
        *[{"role": m.role, "content": m.content} for m in chat.messages],
    ]


async def compress_if_needed(chat: Chat, db: Session) -> None:
    total_tokens = sum(_estimate_tokens(m.content) for m in chat.messages)
    if total_tokens <= settings.context_token_limit:
        return

    cutoff = len(chat.messages) // 2
    to_compress = chat.messages[:cutoff]

    summary = await llm.complete([
        {
            "role": "system",
            "content": "Summarize the following conversation concisely, preserving all key facts and decisions.",
        },
        *[{"role": m.role, "content": m.content} for m in to_compress],
        {"role": "user", "content": "Provide a concise summary."},
    ])

    if chat.context_summary:
        summary = await llm.complete([
            {
                "role": "system",
                "content": "Merge these two conversation summaries into one coherent summary.",
            },
            {
                "role": "user",
                "content": f"Older summary:\n{chat.context_summary}\n\nNewer summary:\n{summary}",
            },
        ])

    chat.context_summary = summary
    for msg in to_compress:
        db.delete(msg)
    db.commit()
    db.refresh(chat)


async def generate_title(first_message: str) -> str:
    title = await llm.complete([
        {
            "role": "system",
            "content": (
                "Generate a short 3-5 word title for a conversation starting with the user's message. "
                "Reply with only the title, no punctuation or quotes."
            ),
        },
        {"role": "user", "content": first_message[:500]},
    ])
    return title[:100]
