from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient


async def _stream_hello():
    yield "Hello"
    yield " world"


def test_send_empty_message(client: TestClient):
    chat_id = client.post("/chats").json()["id"]
    r = client.post(f"/chats/{chat_id}/messages", json={"content": ""})
    assert r.status_code == 422


def test_send_whitespace_message(client: TestClient):
    chat_id = client.post("/chats").json()["id"]
    r = client.post(f"/chats/{chat_id}/messages", json={"content": "   "})
    assert r.status_code == 422


def test_send_message_too_long(client: TestClient):
    chat_id = client.post("/chats").json()["id"]
    r = client.post(f"/chats/{chat_id}/messages", json={"content": "x" * 10_001})
    assert r.status_code == 422


def test_send_message_to_nonexistent_chat(client: TestClient):
    r = client.post("/chats/99999/messages", json={"content": "Hello"})
    assert r.status_code == 404


def test_send_message_streams_and_saves(client: TestClient):
    chat_id = client.post("/chats").json()["id"]

    with (
        patch("app.services.llm.stream_completion", return_value=_stream_hello()),
        patch("app.services.context.generate_title", new=AsyncMock(return_value="Hello World")),
    ):
        r = client.post(f"/chats/{chat_id}/messages", json={"content": "Hi"})
        assert r.status_code == 200
        assert "text/event-stream" in r.headers["content-type"]

        events = [
            line[6:] for line in r.text.splitlines() if line.startswith("data: ")
        ]
        import json
        parsed = [json.loads(e) for e in events]
        types = [e["type"] for e in parsed]

        assert "title" in types
        assert "chunk" in types
        assert "done" in types

        title_event = next(e for e in parsed if e["type"] == "title")
        assert title_event["content"] == "Hello World"

        full_text = "".join(e["content"] for e in parsed if e["type"] == "chunk")
        assert full_text == "Hello world"

    chat = client.get(f"/chats/{chat_id}").json()
    assert len(chat["messages"]) == 2
    assert chat["messages"][0]["role"] == "user"
    assert chat["messages"][0]["content"] == "Hi"
    assert chat["messages"][1]["role"] == "assistant"
    assert chat["messages"][1]["content"] == "Hello world"
    assert chat["title"] == "Hello World"


def test_subsequent_messages_no_title_event(client: TestClient):
    chat_id = client.post("/chats").json()["id"]

    with (
        patch("app.services.llm.stream_completion", return_value=_stream_hello()),
        patch("app.services.context.generate_title", new=AsyncMock(return_value="Test")),
    ):
        client.post(f"/chats/{chat_id}/messages", json={"content": "First"})

    with patch("app.services.llm.stream_completion", return_value=_stream_hello()):
        r = client.post(f"/chats/{chat_id}/messages", json={"content": "Second"})
        import json
        events = [json.loads(l[6:]) for l in r.text.splitlines() if l.startswith("data: ")]
        assert not any(e["type"] == "title" for e in events)


def test_message_content_is_stripped(client: TestClient):
    chat_id = client.post("/chats").json()["id"]

    with (
        patch("app.services.llm.stream_completion", return_value=_stream_hello()),
        patch("app.services.context.generate_title", new=AsyncMock(return_value="T")),
    ):
        client.post(f"/chats/{chat_id}/messages", json={"content": "  Hello  "})

    chat = client.get(f"/chats/{chat_id}").json()
    assert chat["messages"][0]["content"] == "Hello"
