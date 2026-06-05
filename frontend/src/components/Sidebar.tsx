"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Trash2, MessageSquare, PanelLeftClose } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useChats, useDeleteChat } from "@/hooks/useChats";
import { Skeleton } from "./Skeleton";
import { DeleteChatModal } from "./DeleteChatModal";
import { api } from "@/lib/api";
import type { Chat } from "@/types";

interface Props {
  onClose?: () => void;
}

export function Sidebar({ onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: chats, isLoading } = useChats();
  const deleteChat = useDeleteChat();
  const [toDelete, setToDelete] = useState<Chat | null>(null);

  const prefetch = (chatId: number) => {
    queryClient.prefetchQuery({
      queryKey: ["chat", chatId],
      queryFn: () => api.getChat(chatId),
      staleTime: 1000 * 30,
    });
  };

  return (
    <>
      <aside className="w-[220px] h-full flex flex-col bg-[#111113] border-r border-[#1e1e22]">
        <div className="flex items-center gap-1 p-2">
          <button
            onClick={() => router.push("/")}
            className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#b0b0b0] hover:bg-white/[0.06] hover:text-[#e8e8e8] transition-all duration-150 group"
          >
            <Plus className="w-4 h-4 flex-shrink-0 group-hover:rotate-90 transition-transform duration-200" />
            New chat
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close sidebar"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#555] hover:text-[#b0b0b0] hover:bg-white/[0.05] transition-colors flex-shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="h-px bg-[#1e1e22] mx-2" />

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isLoading ? (
            <div className="space-y-1 px-1 pt-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-8 rounded-lg"
                  style={{ opacity: 1 - i * 0.1 }}
                />
              ))}
            </div>
          ) : !chats?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MessageSquare className="w-6 h-6 text-[#2a2a2e] mb-2" />
              <p className="text-xs text-[#4a4a52]">No conversations yet</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = pathname === `/chat/${chat.id}`;
              return (
                <div
                  key={chat.id}
                  className={clsx(
                    "group relative flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-100",
                    isActive
                      ? "bg-white/[0.09] text-[#eaeaea]"
                      : "text-[#a0a0a0] hover:bg-white/[0.05] hover:text-[#d0d0d0]"
                  )}
                >
                  <Link
                    href={`/chat/${chat.id}`}
                    className="flex-1 truncate pr-6 leading-snug"
                    onMouseEnter={() => prefetch(chat.id)}
                  >
                    {chat.title}
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setToDelete(chat);
                    }}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#555] hover:text-red-400 hover:bg-red-400/10 transition-all duration-100"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </nav>
      </aside>

      {toDelete && (
        <DeleteChatModal
          chatTitle={toDelete.title}
          onConfirm={() => {
            deleteChat.mutate(toDelete.id);
            setToDelete(null);
          }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
