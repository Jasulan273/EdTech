"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Sparkles, ArrowDown } from "lucide-react";
import { api } from "@/lib/api";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { SelectionMenu } from "./SelectionMenu";
import { Skeleton } from "./Skeleton";

const SUGGESTED_PROMPTS = [
  "Explain quantum computing simply",
  "Write a Python web scraper",
  "Help me debug this code",
  "Difference between TCP and UDP?",
];

interface ContextMenu {
  x: number;
  y: number;
  selectedText: string;
}

export function ChatView({ chatId }: { chatId: number }) {
  const queryClient = useQueryClient();
  const { data: chat, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => api.getChat(chatId),
    placeholderData: (prev) => prev,
  });

  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [preFill, setPreFill] = useState<string | undefined>(undefined);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasSentPending = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false);
      return;
    }
    const t = setTimeout(() => setShowSkeleton(true), 160);
    return () => clearTimeout(t);
  }, [isLoading, chatId]);

  useEffect(() => {
    if (hasSentPending.current || isSending || isLoading) return;
    const pending = sessionStorage.getItem("pendingMessage");
    if (!pending) return;
    sessionStorage.removeItem("pendingMessage");
    hasSentPending.current = true;
    handleSend(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") =>
    bottomRef.current?.scrollIntoView({ behavior });

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.messages.length, streamingContent]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const text = window.getSelection()?.toString().trim();
    if (!text) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, selectedText: text });
  }, []);

  const handleSend = async (content: string) => {
    setPendingMessage(content);
    setStreamingContent("");
    setError(null);
    setIsSending(true);
    scrollToBottom();

    await api.sendMessage(chatId, content, {
      onChunk: (chunk) => setStreamingContent((prev) => prev + chunk),
      onTitle: () => queryClient.invalidateQueries({ queryKey: ["chats"] }),
      onDone: () => {
        setPendingMessage(null);
        setStreamingContent("");
        setIsSending(false);
        queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      },
      onError: (err) => {
        setPendingMessage(null);
        setStreamingContent("");
        setIsSending(false);
        setError(err.message);
      },
    });
  };

  if (showSkeleton && !chat) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {[
              { user: true, w: "w-52" },
              { user: false },
              { user: true, w: "w-36" },
              { user: false },
            ].map((item, i) => (
              <div key={i} className={`flex gap-3 ${item.user ? "justify-end" : ""}`}>
                {!item.user && (
                  <Skeleton className="w-6 h-6 rounded-md flex-shrink-0 mt-0.5" />
                )}
                {item.user ? (
                  <Skeleton className={`h-11 ${item.w ?? "w-64"} rounded-2xl`} />
                ) : (
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-[52px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !chat?.messages.length && !pendingMessage;

  return (
    <div className="flex flex-col h-full relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onContextMenu={handleContextMenu}
        className="flex-1 overflow-y-auto px-4 py-8"
      >
        <div className="max-w-3xl mx-auto space-y-7">
          {isEmpty && !isSending && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-8">
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-[#7a7a9a]" />
                </div>
                <p className="text-[15px] text-[#606068]">How can I help you today?</p>
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
          )}

          {chat?.messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onRetry={
                msg.role === "assistant" &&
                i === chat.messages.length - 1 &&
                !isSending
                  ? () => {
                      const lastUser = [...chat.messages]
                        .reverse()
                        .find((m) => m.role === "user");
                      if (lastUser) handleSend(lastUser.content);
                    }
                  : undefined
              }
            />
          ))}

          {pendingMessage && (
            <MessageBubble message={{ role: "user", content: pendingMessage }} />
          )}

          {isSending && !streamingContent && (
            <div className="flex gap-3 animate-slide-up">
              <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-md bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-[#7a7a9a]" />
              </div>
              <div className="flex items-center gap-2 py-1">
                <span className="text-sm text-[#606068]">Thinking</span>
                <span className="flex gap-[3px]">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-1 h-1 rounded-full bg-[#606068] animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}

          {streamingContent && (
            <MessageBubble
              message={{ role: "assistant", content: streamingContent }}
              streaming
            />
          )}

          {error && (
            <div className="flex items-start gap-2.5 text-sm bg-red-400/[0.04] border border-red-400/10 rounded-xl px-4 py-3 animate-slide-up">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400/80" />
              <div>
                <p className="font-medium text-red-400/90">Failed to get response</p>
                <p className="text-red-400/50 mt-0.5 text-xs">{error}</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {showScrollDown && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-6 w-8 h-8 rounded-full bg-[#1c1c1f] border border-[#2a2a2e] flex items-center justify-center text-[#909098] hover:text-[#e2e2e2] hover:border-[#3a3a3e] shadow-lg transition-all duration-150 animate-slide-up"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {contextMenu && (
        <SelectionMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onQuote={() => {
            const quoted =
              contextMenu.selectedText
                .split("\n")
                .map((l) => `> ${l}`)
                .join("\n") + "\n\n";
            setPreFill(quoted);
            setContextMenu(null);
            window.getSelection()?.removeAllRanges();
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      <MessageInput
        onSend={handleSend}
        disabled={isSending}
        preFill={preFill}
        onPreFillConsumed={() => setPreFill(undefined)}
      />
    </div>
  );
}
