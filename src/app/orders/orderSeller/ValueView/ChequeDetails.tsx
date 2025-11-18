// components/ValueView/ChequeDetails.tsx

import React from "react";
import { fmtPctSigned } from "./utils/currencyUtils";

interface ChequeDetailsProps {
  isOpen: boolean;
  onToggle: () => void;
  rawAmount?: string;
  amount?: string;
  daysTotal?: number;
  pctInt?: number;
  interest$?: number;
  chequePromoRate?: number;
  chequePromoAmount?: number;
  currencyFormatter: Intl.NumberFormat;
}

export function ChequeDetails({
  isOpen,
  onToggle,
  rawAmount,
  amount,
  daysTotal,
  pctInt,
  interest$,
  chequePromoRate,
  chequePromoAmount,
  currencyFormatter,
}: ChequeDetailsProps) {
  const toNum = (s?: string) =>
    Number.parseFloat((s ?? "").replace(",", ".")) || 0;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
      {/* Encabezado con toggle */}
      <div className="flex items-center gap-3 justify-center">
        <button
          type="button"
          onClick={onToggle}
          className={`inline-flex items-center gap-1 text-xs rounded px-2 py-1 border 
            ${
              isOpen
                ? "border-zinc-500 text-zinc-200 bg-zinc-700"
                : "border-zinc-700 text-zinc-300 bg-zinc-800 hover:bg-zinc-700/60"
            }`}
        >
          {isOpen ? "Ocultar" : "Ver detalle"}
          <svg
            viewBox="0 0 20 20"
            className={`w-3.5 h-3.5 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 0 1 .94 1.17l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19z" />
          </svg>
        </button>
      </div>

      {/* Detalle expandible */}
      {isOpen && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-300">Valor Bruto</span>
            <span className="text-white tabular-nums">
              {currencyFormatter.format(toNum(rawAmount || amount))}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-300">Días</span>
            <span className="text-white tabular-nums">
              {Number.isFinite(daysTotal) ? daysTotal : "—"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-300">%</span>
            <span className="text-rose-400 tabular-nums">
              {pctInt !== undefined ? fmtPctSigned(pctInt) : "—"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-300">Costo financiero</span>
            <span className="text-rose-400 tabular-nums">
              {interest$ !== undefined
                ? currencyFormatter.format(interest$)
                : "—"}
            </span>
          </div>

          {chequePromoRate !== undefined && chequePromoRate > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-zinc-300">Promo</span>
                <span className="text-emerald-400 tabular-nums">
                  {(chequePromoRate * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Descuento Promo</span>
                <span className="text-emerald-400 tabular-nums">
                  {chequePromoAmount !== undefined
                    ? currencyFormatter.format(chequePromoAmount)
                    : "—"}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}