import json
import httpx
from typing import AsyncIterator
from ..config import settings


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Chat",
    }


async def stream_completion(messages: list[dict]) -> AsyncIterator[str]:
    for model in settings.models:
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"{settings.openrouter_base_url}/chat/completions",
                    headers=_headers(),
                    json={"model": model, "messages": messages, "stream": True},
                ) as resp:
                    if resp.status_code >= 400:
                        continue
                    async for line in resp.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        payload = line[6:]
                        if payload == "[DONE]":
                            return
                        try:
                            delta = json.loads(payload)["choices"][0]["delta"].get("content") or ""
                            if delta:
                                yield delta
                        except (KeyError, IndexError, json.JSONDecodeError):
                            continue
                    return
        except httpx.RequestError:
            continue

    raise RuntimeError(f"All models unavailable: {settings.models}")


async def complete(messages: list[dict]) -> str:
    for model in settings.models:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{settings.openrouter_base_url}/chat/completions",
                    headers=_headers(),
                    json={"model": model, "messages": messages},
                )
                if resp.status_code >= 400:
                    continue
                return resp.json()["choices"][0]["message"]["content"].strip()
        except httpx.RequestError:
            continue

    raise RuntimeError(f"All models unavailable: {settings.models}")
