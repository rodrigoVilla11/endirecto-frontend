// components/ConfirmDialog.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  canConfirm?: boolean;
  invalidReason?: string;
  title: string;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  isLoading,
  canConfirm = true,
  invalidReason,
  title,
  children,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  const disabled = isLoading || !canConfirm;

  const handleConfirmClick = () => {
    if (disabled) return;
    onConfirm();
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div
        className="relative w-full max-w-lg rounded-xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h4 id="confirm-title" className="text-lg font-semibold">
            {title}
          </h4>
        </div>

        <div className="p-4 space-y-3">
          {children}
          {!canConfirm && !!invalidReason && (
            <div className="text-sm text-red-500 mt-1">{invalidReason}</div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={disabled}
            aria-disabled={disabled}
            className={`px-3 py-2 rounded text-white
              ${
                disabled
                  ? "bg-zinc-500 cursor-not-allowed"
                  : isLoading
                  ? "bg-amber-500 cursor-wait"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            title={
              !canConfirm && !isLoading
                ? invalidReason || "Completar campos requeridos"
                : undefined
            }
          >
            {isLoading ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDialog;
