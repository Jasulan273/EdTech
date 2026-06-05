from fastapi.testclient import TestClient


def test_list_chats_empty(client: TestClient):
    r = client.get("/chats")
    assert r.status_code == 200
    assert r.json() == []


def test_create_chat(client: TestClient):
    r = client.post("/chats")
    assert r.status_code == 201
    body = r.json()
    assert body["title"] == "New Chat"
    assert "id" in body
    assert "created_at" in body


def test_list_chats_returns_newest_first(client: TestClient):
    client.post("/chats")
    client.post("/chats")
    r = client.get("/chats")
    chats = r.json()
    assert len(chats) == 2
    assert chats[0]["id"] > chats[1]["id"]


def test_get_chat(client: TestClient):
    chat_id = client.post("/chats").json()["id"]
    r = client.get(f"/chats/{chat_id}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == chat_id
    assert body["messages"] == []


def test_get_chat_not_found(client: TestClient):
    r = client.get("/chats/99999")
    assert r.status_code == 404


def test_delete_chat(client: TestClient):
    chat_id = client.post("/chats").json()["id"]
    r = client.delete(f"/chats/{chat_id}")
    assert r.status_code == 204
    assert client.get(f"/chats/{chat_id}").status_code == 404


def test_delete_chat_not_found(client: TestClient):
    r = client.delete("/chats/99999")
    assert r.status_code == 404


def test_delete_chat_removes_from_list(client: TestClient):
    chat_id = client.post("/chats").json()["id"]
    client.delete(f"/chats/{chat_id}")
    ids = [c["id"] for c in client.get("/chats").json()]
    assert chat_id not in ids
