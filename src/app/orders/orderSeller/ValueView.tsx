"use client";

import React, { useMemo } from "react";

type PaymentMethod = "efectivo" | "transferencia" | "cheque";

export type ValueItem = {
  amount: string;
  selectedReason: string; // Concepto / motivo
  method: PaymentMethod;
  bank?: string;
  receipt?: File | string;
};

export default function ValueView({
  newValues,
  setNewValues,
}: {
  newValues: ValueItem[];
  setNewValues: React.Dispatch<React.SetStateAction<ValueItem[]>>;
}) {
  const currencyFmt = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const addRow = () => {
    setNewValues((prev) => [
      {
        amount: "",
        selectedReason: "",
        method: "efectivo",
        bank: "",
        receipt: undefined,
      },
      ...prev,
    ]);
  };

  const removeRow = (idx: number) => {
    setNewValues((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, patch: Partial<ValueItem>) => {
    setNewValues((prev) => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], ...patch };
      if (patch.method === "efectivo") {
        clone[idx].bank = "";
        clone[idx].receipt = undefined;
      }
      return clone;
    });
  };

  const handleFile = (idx: number, file?: File) => {
    updateRow(idx, { receipt: file });
  };

  const totalValues = useMemo(
    () => newValues.reduce((acc, v) => acc + (parseFloat(v.amount || "0") || 0), 0),
    [newValues]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium">Valores</h4>
        <button
          onClick={addRow}
          className="px-3 py-2 rounded bg-emerald-500 text-black font-medium hover:brightness-95 active:scale-95"
        >
          + Agregar valor
        </button>
      </div>

      {newValues.length === 0 && (
        <div className="text-zinc-400 text-sm">No hay valores cargados.</div>
      )}

      <div className="space-y-2">
        {newValues.map((v, idx) => {
          const showBankAndReceipt =
            v.method === "transferencia" || v.method === "cheque";

          const receiptPreview =
            typeof v.receipt !== "string" && v.receipt instanceof File
              ? URL.createObjectURL(v.receipt)
              : typeof v.receipt === "string"
              ? v.receipt
              : undefined;

          return (
            <div
              key={idx}
              className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/50"
            >
              {/* FILA PRINCIPAL
                 md: cuatro columnas fijas => [Monto | Concepto | Medio de pago | Acciones]
                 En mobile cae a una columna, pero los pills hacen scroll horizontal */}
              <div
                className="
                  grid grid-cols-1
                  md:grid-cols-[8rem,1fr,26rem,7rem]
                  gap-3 items-start
                "
              >
                {/* Monto */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Monto</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0.00"
                    value={v.amount}
                    onChange={(e) => updateRow(idx, { amount: e.target.value })}
                    className="w-full h-10 px-3 rounded bg-zinc-700 text-white outline-none tabular-nums"
                  />
                </div>

                {/* Concepto */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Concepto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pago factura 001-0000123"
                    value={v.selectedReason}
                    onChange={(e) =>
                      updateRow(idx, { selectedReason: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded bg-zinc-700 text-white outline-none"
                  />
                </div>

                {/* Medio de pago */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Medio de pago
                  </label>
                  <div className="flex gap-2 overflow-x-auto md:overflow-visible flex-nowrap md:flex-nowrap pr-1">
                    <RadioPill
                      label="Efectivo"
                      selected={v.method === "efectivo"}
                      onClick={() => updateRow(idx, { method: "efectivo" })}
                      className="min-w-[8.5rem]"
                    />
                    <RadioPill
                      label="Transferencia"
                      selected={v.method === "transferencia"}
                      onClick={() => updateRow(idx, { method: "transferencia" })}
                      className="min-w-[9.5rem]"
                    />
                    <RadioPill
                      label="Cheque"
                      selected={v.method === "cheque"}
                      onClick={() => updateRow(idx, { method: "cheque" })}
                      className="min-w-[7.5rem]"
                    />
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex md:justify-end">
                  <button
                    onClick={() => removeRow(idx)}
                    className="w-full md:w-auto h-10 px-3 rounded bg-zinc-700 text-white hover:bg-zinc-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Campos condicionales */}
              {showBankAndReceipt && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
                  {/* Banco */}
                  <div className="md:col-span-4">
                    <label className="block text-xs text-zinc-400 mb-1">
                      Banco
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Banco Galicia"
                      value={v.bank || ""}
                      onChange={(e) => updateRow(idx, { bank: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-zinc-700 text-white outline-none"
                    />
                  </div>

                  {/* Comprobante */}
                  <div className="md:col-span-4">
                    <label className="block text-xs text-zinc-400 mb-1">
                      Comprobante (foto)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(idx, e.target.files?.[0])}
                      className="w-full h-10 px-3 rounded bg-zinc-700 text-white outline-none file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-zinc-600 file:text-white"
                    />
                  </div>

                  {/* Vista previa */}
                  {receiptPreview && (
                    <div className="md:col-span-4">
                      <label className="block text-xs text-zinc-400 mb-1">
                        Vista previa
                      </label>
                      <div className="h-[120px] rounded overflow-hidden border border-zinc-700 bg-black/30 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={receiptPreview}
                          alt="Comprobante"
                          className="object-contain h-full w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pie: monto formateado */}
              <div className="mt-3 text-xs text-zinc-400">
                {v.amount
                  ? `≈ ${currencyFmt.format(
                      parseFloat(v.amount || "0") || 0
                    )}`
                  : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total de valores */}
      <div className="text-right text-sm text-white">
        Total valores: <strong>{currencyFmt.format(totalValues)}</strong>
      </div>
    </div>
  );
}

/* ================== UI helper ================== */
function RadioPill({
  label,
  selected,
  onClick,
  className = "",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 px-3 rounded text-center text-sm leading-snug shrink-0
        ${selected ? "bg-emerald-500 text-black" : "bg-zinc-700 text-white"}
        ${className}`}
    >
      {label}
    </button>
  );
}
