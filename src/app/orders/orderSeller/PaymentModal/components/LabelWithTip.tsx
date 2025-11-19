// components/LabelWithTip.tsx
"use client";

import React from "react";
import { InfoIcon } from "lucide-react";
import { Tip } from "./Tip";

export function LabelWithTip({ label, tip }: { label: string; tip: string }) {
  return (
    <Tip text={tip}>
      <span className="inline-flex items-center gap-1">
        <span>{label}</span>
        <InfoIcon className="w-3.5 h-3.5 text-zinc-400" />
      </span>
    </Tip>
  );
}

export default LabelWithTip;
