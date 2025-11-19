// components/Tip.tsx
"use client";

import React from "react";

export function Tip({
  text,
  children,
  side = "top",
}: {
  text: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const pos =
    side === "top"
      ? "bottom-full mb-1 left-1/2 -translate-x-1/2"
      : side === "bottom"
      ? "top-full mt-1 left-1/2 -translate-x-1/2"
      : side === "left"
      ? "right-full mr-1 top-1/2 -translate-y-1/2"
      : "left-full ml-1 top-1/2 -translate-y-1/2";

  return (
    <span
      className="relative inline-flex items-center gap-1 group"
      role="tooltip"
      title={text}
    >
      {children}
      <span
        className={`pointer-events-none absolute ${pos} z-10 max-w-[18rem] rounded-md border border-zinc-700
        bg-zinc-900 px-2 py-1 text-xs text-zinc-200 opacity-0 shadow-lg
        transition-opacity duration-150 group-hover:opacity-100`}
      >
        {text}
      </span>
    </span>
  );
}
