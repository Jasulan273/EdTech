"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Copy, Check, RotateCcw } from "lucide-react";
import clsx from "clsx";
import type { Message } from "@/types";
import { markdownToPlainText } from "@/lib/markdown-to-text";

interface Props {
  message: Pick<Message, "role" | "content">;
  streaming?: boolean;
  onRetry?: () => void;
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(markdownToPlainText(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      title="Copy"
      className={clsx(
        "p-1.5 rounded-md transition-all duration-150",
        "text-[#555] hover:text-[#c0c0c0] hover:bg-white/[0.06]",
        className
      )}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export function MessageBubble({ message, streaming, onRetry }: Props) {
  const isUser = message.role === "user";
  const [actionsVisible, setActionsVisible] = useState(false);

  if (isUser) {
    return (
      <div
        className="flex justify-end gap-2 items-end group animate-slide-up"
        onMouseEnter={() => setActionsVisible(true)}
        onMouseLeave={() => setActionsVisible(false)}
      >
        <div
          className={clsx(
            "flex gap-1 items-center transition-opacity duration-150 self-end mb-1",
            actionsVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <CopyButton text={message.content} />
        </div>
        <div className="max-w-[68%] bg-[#1c1c1f] border border-[#2a2a2e] rounded-2xl rounded-br-md px-4 py-3 text-[15px] leading-[1.65] text-[#e8e8e8]">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex gap-3 group animate-slide-up"
      onMouseEnter={() => setActionsVisible(true)}
      onMouseLeave={() => setActionsVisible(false)}
    >
      <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-md bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
        <Sparkles className="w-3 h-3 text-[#7a7a9a]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="chat-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
          {streaming && (
            <span className="inline-block w-[2px] h-[15px] bg-[#7a7a9a] ml-0.5 translate-y-0.5 animate-blink" />
          )}
        </div>

        {!streaming && (
          <div
            className={clsx(
              "flex items-center gap-0.5 mt-2 transition-opacity duration-150",
              actionsVisible ? "opacity-100" : "opacity-0"
            )}
          >
            <CopyButton text={message.content} />
            {onRetry && (
              <button
                onClick={onRetry}
                title="Regenerate"
                className="p-1.5 rounded-md text-[#555] hover:text-[#c0c0c0] hover:bg-white/[0.06] transition-all duration-150"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
