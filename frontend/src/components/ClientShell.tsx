"use client";

import { useState, useEffect } from "react";
import { PanelLeft } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved !== null) setOpen(saved === "open");
  }, []);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar", next ? "open" : "closed");
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      <div
        className="flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out"
        style={{ width: open ? 220 : 0 }}
      >
        <div className="w-[220px] h-full">
          <Sidebar onClose={toggle} />
        </div>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        {!open && (
          <button
            onClick={toggle}
            title="Open sidebar"
            className="absolute top-3 left-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-[#555] hover:text-[#c0c0c0] hover:bg-white/[0.05] transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
