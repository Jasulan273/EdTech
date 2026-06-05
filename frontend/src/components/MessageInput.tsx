"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
  preFill?: string;
  onPreFillConsumed?: () => void;
}

export function MessageInput({ onSend, disabled, preFill, onPreFillConsumed }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!preFill) return;
    setValue(preFill);
    onPreFillConsumed?.();
    setTimeout(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(preFill.length, preFill.length);
      if (ref.current) {
        ref.current.style.height = "auto";
        ref.current.style.height = `${Math.min(ref.current.scrollHeight, 200)}px`;
      }
    }, 0);
  }, [preFill, onPreFillConsumed]);

  const canSend = value.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div
          className={clsx(
            "flex items-end gap-3 rounded-2xl border bg-[#111113] px-4 py-3 transition-colors duration-150",
            disabled
              ? "border-[#1e1e22] opacity-60"
              : "border-[#252528] focus-within:border-[#383840]"
          )}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Message…"
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent text-[15px] text-[#e2e2e2] placeholder:text-[#505058] outline-none leading-[1.6] max-h-[200px] py-0.5 disabled:cursor-not-allowed"
          />
          <button
            onClick={submit}
            disabled={!canSend}
            className={clsx(
              "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150",
              canSend
                ? "bg-[#e8e8e8] text-[#0c0c0d] hover:bg-white shadow-sm"
                : "bg-[#1c1c1f] border border-[#252528] text-[#333338] cursor-not-allowed"
            )}
          >
            {disabled ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-[#404048]">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
