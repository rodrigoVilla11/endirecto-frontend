// components/ValueView/LabelWithTip.tsx

import React, { useRef } from "react";

function InfoIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.5a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0v-5zM10 6a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  );
}

/** Tooltip simple, accesible y sin dependencias (con clamp a viewport) */
function Tip({
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
      ? "bottom-full mb-1 left-1/2"
      : side === "bottom"
      ? "top-full mt-1 left-1/2"
      : side === "left"
      ? "right-full mr-1 top-1/2"
      : "left-full ml-1 top-1/2";

  const tipRef = useRef<HTMLSpanElement>(null);

  const clampToViewport = () => {
    const tip = tipRef.current;
    if (!tip) return;

    // Reset al estado centrado antes de medir
    tip.style.transform =
      side === "left" || side === "right"
        ? "translateY(-50%)"
        : "translateX(-50%)";

    const r = tip.getBoundingClientRect();
    const vw = window.innerWidth;
    const margin = 8;

    if (side === "top" || side === "bottom") {
      let push = 0;
      if (r.left < margin) push = margin - r.left;
      if (r.right > vw - margin) push = -(r.right - (vw - margin));

      if (push !== 0) {
        tip.style.transform = `translateX(calc(-50% + ${push}px))`;
      }
    } else {
      const vh = window.innerHeight;
      let pushY = 0;
      if (r.top < margin) pushY = margin - r.top;
      if (r.bottom > vh - margin) pushY = -(r.bottom - (vh - margin));
      if (pushY !== 0) {
        tip.style.transform = `translateY(calc(-50% + ${pushY}px))`;
      }
    }
  };

  return (
    <span
      className="relative inline-flex items-center gap-1 group"
      onMouseEnter={clampToViewport}
      onMouseMove={clampToViewport}
      onFocus={clampToViewport}
    >
      {children}
      <span
        ref={tipRef}
        role="tooltip"
        className={`
          pointer-events-none absolute ${pos} z-10
          min-w-[16rem] max-w-[min(32rem,calc(100vw-1rem))]
          rounded-md border border-zinc-700 bg-zinc-900
          px-3 py-1.5 text-sm text-zinc-200
          text-left whitespace-normal break-words
          opacity-0 shadow-lg transition-opacity duration-150
          group-hover:opacity-100 group-focus-within:opacity-100
          ${
            side === "left" || side === "right"
              ? "-translate-y-1/2"
              : "-translate-x-1/2"
          }
        `}
        title={text}
      >
        {text}
      </span>
    </span>
  );
}

/** Etiqueta con ícono + tooltip */
export function LabelWithTip({
  label,
  tip,
  side = "top",
  className = "",
}: {
  label: string;
  tip: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <Tip text={tip} side={side}>
      <span
        className={`inline-flex items-center gap-1 cursor-help ${className}`}
        tabIndex={0}
      >
        <span>{label}</span>
        <InfoIcon className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
      </span>
    </Tip>
  );
}