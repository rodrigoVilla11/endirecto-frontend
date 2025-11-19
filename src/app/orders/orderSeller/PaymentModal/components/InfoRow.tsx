// components/InfoRow.tsx
"use client";

import React from "react";

interface InfoRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  valueClassName?: string;
}

export function InfoRow({
  label,
  value,
  valueClassName = "text-white",
}: InfoRowProps) {
  return (
    <div className="p-4 flex justify-between items-center border-b border-zinc-800">
      <span className="text-zinc-400">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

export default InfoRow;
