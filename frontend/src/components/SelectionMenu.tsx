"use client";

import { useEffect, useRef } from "react";
import { Quote } from "lucide-react";

interface Props {
  x: number;
  y: number;
  onQuote: () => void;
  onClose: () => void;
}

export function SelectionMenu({ x, y, onQuote, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 animate-fade-in"
      style={{ top: y, left: x }}
    >
      <div className="bg-[#1c1c1f] border border-[#2a2a2e] rounded-lg shadow-xl overflow-hidden text-[13px]">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            onQuote();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-[#c0c0c0] hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <Quote className="w-3.5 h-3.5" />
          Quote in input
        </button>
      </div>
    </div>
  );
}
