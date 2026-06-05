"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MessageInput } from "./MessageInput";

const SUGGESTED_PROMPTS = [
  "Explain quantum computing simply",
  "Write a Python web scraper",
  "Help me debug this code",
  "Difference between TCP and UDP?",
];

export function DraftChatView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSend = async (content: string) => {
    const chat = await api.createChat();
    queryClient.invalidateQueries({ queryKey: ["chats"] });
    sessionStorage.setItem("pendingMessage", content);
    router.push(`/chat/${chat.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
        <div className="text-center">
          <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-5 h-5 text-[#7a7a9a]" />
          </div>
          <h1 className="text-[17px] font-medium text-[#d0d0d8] tracking-tight">
            How can I help you today?
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full max-w-md">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="px-3 py-2.5 rounded-xl bg-[#111113] border border-[#1e1e22] text-sm text-[#909098] hover:border-[#2a2a2e] hover:text-[#c8c8d0] hover:bg-[#161618] transition-all duration-150 text-left leading-snug"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <MessageInput onSend={handleSend} />
    </div>
  );
}
