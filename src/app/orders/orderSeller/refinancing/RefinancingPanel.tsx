import React from "react";
import { ComputedDiscount } from "./types";

type RefinancingPanelProps = {
  isVisible: boolean;
  remainingAmount: number;
  hasInvoiceToday: boolean;
  computedDiscounts: ComputedDiscount[];
  onToggle: () => void;
  onGenerateCheques: (daysList: number[]) => void;
  currencyFormatter: Intl.NumberFormat;
  // 👇 NUEVO: para abrir el modal calculadora
  onOpenCalculator?: () => void;
  hasValues?: boolean; // para mostrar uno u otro botón
};

export function RefinancingPanel({
  isVisible,
  remainingAmount,
  hasInvoiceToday,
  computedDiscounts,
  onToggle,
  onGenerateCheques,
  currencyFormatter,
  onOpenCalculator,
  hasValues = false,
}: RefinancingPanelProps) {
  if (!isVisible) {
    return (
      <>
        {/* Botón "Refi. Saldo" (abre ModalCalculator) */}
        {hasValues && onOpenCalculator && (
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            onClick={() => {
              if (hasInvoiceToday) {
                alert("No se puede refinanciar saldo cuando hay una factura de hoy.");
                return;
              }
              onOpenCalculator();
            }}
            disabled={computedDiscounts.length === 0 || hasInvoiceToday}
            title={
              hasInvoiceToday
                ? "No disponible: hay una factura de hoy"
                : "Armar plan en 30/60/90 con cheques iguales"
            }
          >
            Refi. Saldo
          </button>
        )}

        {/* Botón "Refinanciar" (presets rápidos) */}
        {!hasValues && (
          <button
            className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-60"
            onClick={onToggle}
            disabled={computedDiscounts.length === 0 || hasInvoiceToday}
            title={
              hasInvoiceToday
                ? "No disponible: hay una factura de hoy"
                : "Armar plan en 30/60/90 con cheques iguales"
            }
          >
            Refinanciar
          </button>
        )}
      </>
    );
  }

  const presetOptions = [
    { label: "1 cheque (30 días)", days: [30] },
    { label: "2 cheques (30/60)", days: [30, 60] },
    { label: "3 cheques (30/60/90)", days: [30, 60, 90] },
    { label: "4 cheques (30/60/90/120)", days: [30, 60, 90, 120] },
    { label: "5 cheques (30/60/90/120/150)", days: [30, 60, 90, 120, 150] },
    { label: "6 cheques (30/60/90/120/150/180)", days: [30, 60, 90, 120, 150, 180] },
  ];

  return (
    <div className="mt-4 rounded-lg border border-zinc-800 p-4 bg-zinc-900/50 space-y-3">
      <div className="flex justify-between items-center">
        <div className="text-sm text-zinc-300">
          Saldo a refinanciar:{" "}
          <b>{currencyFormatter.format(remainingAmount)}</b>
        </div>
        <button
          onClick={onToggle}
          className="text-zinc-400 hover:text-white text-sm"
        >
          ✕ Cerrar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {presetOptions.map((option) => (
          <button
            key={option.label}
            className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm"
            onClick={() => onGenerateCheques(option.days)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-zinc-400">
        Cada cheque se calcula para que el <i>neto imputable</i> total
        coincida con el saldo a refinanciar. Se respeta la tasa anual y los
        días de gracia configurados.
      </p>
    </div>
  );
}
