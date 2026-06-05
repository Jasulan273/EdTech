"use client";

import { useEffect } from "react";
import { Trash2, X } from "lucide-react";

interface Props {
  chatTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteChatModal({ chatTitle, onConfirm, onCancel }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative bg-[#161618] border border-[#2a2a2e] rounded-xl shadow-2xl w-full max-w-sm p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-md text-[#4a4a4a] hover:text-[#e2e2e2] hover:bg-white/[0.04] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-[#e2e2e2]">
              Delete conversation
            </h2>
            <p className="mt-1 text-sm text-[#8a8a8a] leading-relaxed">
              &ldquo;{chatTitle}&rdquo; will be permanently deleted and cannot
              be recovered.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-[#8a8a8a] hover:text-[#e2e2e2] hover:bg-white/[0.04] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
