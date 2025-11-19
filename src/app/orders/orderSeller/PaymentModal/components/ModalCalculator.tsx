// components/ModalCalculator.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PlanCalculator from "@/app/finance/planCaluculator";
import { ValueItem } from "../../ValueView/types/types";

type ModalCalculatorProps = {
  open: boolean;
  onCancel: () => void;
  grace?: number | null;
  interestSetting?: { value?: number | null } | null;
  portalContainer?: Element | null;
  newValues: ValueItem[];
  setNewValues: React.Dispatch<React.SetStateAction<ValueItem[]>>;
  docsDaysMin?: number;
  docSurchargePending?: number;
  remainingToRefi?: number;
  blockChequeInterest?: boolean;
};

export function ModalCalculator({
  open,
  onCancel,
  grace,
  interestSetting,
  portalContainer,
  newValues,
  setNewValues,
  docsDaysMin,
  docSurchargePending,
  remainingToRefi,
  blockChequeInterest = false,
}: ModalCalculatorProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const prevLen = useRef<number>(newValues?.length ?? 0);

  useEffect(() => setMounted(true), []);

  // Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  // Bloquear scroll body
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Cerrar cuando cambian los valores (se generaron cheques)
  useEffect(() => {
    const len = newValues?.length ?? 0;
    if (prevLen.current !== len) {
      prevLen.current = len;
      onCancel();
    }
  }, [newValues?.length, onCancel]);

  if (!open || !mounted) return null;

  const container = portalContainer ?? document.body;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onCancel();
        }}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-[101] w-full max-w-3xl mx-4 rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl outline-none ring-1 ring-black/5 "
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/10 dark:border-white/10">
          <h2 className="text-lg font-semibold">Cálculo de pagos a plazo</h2>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-xl px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <PlanCalculator
            title="Cálculo de pagos a plazo"
            annualInterestPct={Number(interestSetting?.value) || 96}
            newValues={newValues}
            setNewValues={setNewValues}
            initialTotal={remainingToRefi}
            blockChequeInterest={blockChequeInterest}
          />
        </div>
      </div>
    </div>,
    container
  );
}

export default ModalCalculator;
