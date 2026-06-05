import type { Chat, ChatDetail, StreamCallbacks } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = {
  listChats: (): Promise<Chat[]> =>
    fetch(`${API}/chats`).then((r) => r.json()),

  createChat: (): Promise<Chat> =>
    fetch(`${API}/chats`, { method: "POST" }).then((r) => r.json()),

  getChat: (id: number): Promise<ChatDetail> =>
    fetch(`${API}/chats/${id}`).then((r) => r.json()),

  deleteChat: (id: number): Promise<void> =>
    fetch(`${API}/chats/${id}`, { method: "DELETE" }).then(() => undefined),

  async sendMessage(chatId: number, content: string, cb: StreamCallbacks): Promise<void> {
    let response: Response;
    try {
      response = await fetch(`${API}/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } catch (e) {
      cb.onError(e instanceof Error ? e : new Error("Network error"));
      return;
    }

    if (!response.ok || !response.body) {
      cb.onError(new Error(`HTTP ${response.status}`));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const dataLine = event.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          try {
            const parsed = JSON.parse(dataLine.slice(6));
            if (parsed.type === "chunk") cb.onChunk(parsed.content);
            else if (parsed.type === "title") cb.onTitle(parsed.content);
            else if (parsed.type === "error") cb.onError(new Error(parsed.message));
            else if (parsed.type === "done") cb.onDone();
          } catch {
            //
          }
        }
      }
    } catch (e) {
      cb.onError(e instanceof Error ? e : new Error("Stream error"));
    }
  },
};
