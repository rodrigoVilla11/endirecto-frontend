"use client";

import React, { useMemo } from "react";

type PaymentMethod = "efectivo" | "transferencia" | "cheque";

export type ValueItem = {
  amount: string;
  selectedReason: string; // Concepto / motivo
  method: PaymentMethod;
  bank?: string;
  receipt?: File | string; // guardamos el File; el backend decidirá cómo subirlo
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
      // si cambiamos a efectivo, limpiamos banco/comprobante
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

  const totalValues = useMemo(() => {
    return newValues.reduce((acc, v) => acc + (parseFloat(v.amount || "0") || 0), 0);
  }, [newValues]);

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
          const showBankAndReceipt = v.method === "transferencia" || v.method === "cheque";
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
              <div className="grid md:grid-cols-12 grid-cols-1 gap-3">
                {/* Monto */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Monto</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={v.amount}
                    onChange={(e) => updateRow(idx, { amount: e.target.value })}
                    className="w-full p-2 rounded bg-zinc-700 text-white outline-none"
                  />
                </div>

                {/* Concepto */}
                <div className="md:col-span-4">
                  <label className="block text-xs text-zinc-400 mb-1">Concepto</label>
                  <input
                    type="text"
                    placeholder="Ej: Pago factura 001-0000123"
                    value={v.selectedReason}
                    onChange={(e) => updateRow(idx, { selectedReason: e.target.value })}
                    className="w-full p-2 rounded bg-zinc-700 text-white outline-none"
                  />
                </div>

                {/* Método de pago */}
                <div className="md:col-span-4">
                  <label className="block text-xs text-zinc-400 mb-1">
                    Medio de pago
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <RadioPill
                      label="Efectivo"
                      selected={v.method === "efectivo"}
                      onClick={() => updateRow(idx, { method: "efectivo" })}
                    />
                    <RadioPill
                      label="Transferencia"
                      selected={v.method === "transferencia"}
                      onClick={() => updateRow(idx, { method: "transferencia" })}
                    />
                    <RadioPill
                      label="Cheque"
                      selected={v.method === "cheque"}
                      onClick={() => updateRow(idx, { method: "cheque" })}
                    />
                  </div>
                </div>

                {/* Acciones */}
                <div className="md:col-span-2 flex items-end justify-end">
                  <button
                    onClick={() => removeRow(idx)}
                    className="px-3 py-2 rounded bg-zinc-700 text-white hover:bg-zinc-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Campos condicionales */}
              {showBankAndReceipt && (
                <div className="grid md:grid-cols-12 grid-cols-1 gap-3 mt-3">
                  {/* Banco */}
                  <div className="md:col-span-4">
                    <label className="block text-xs text-zinc-400 mb-1">Banco</label>
                    <input
                      type="text"
                      placeholder="Ej: Banco Galicia"
                      value={v.bank || ""}
                      onChange={(e) => updateRow(idx, { bank: e.target.value })}
                      className="w-full p-2 rounded bg-zinc-700 text-white outline-none"
                    />
                  </div>

                  {/* Comprobante (foto) */}
                  <div className="md:col-span-4">
                    <label className="block text-xs text-zinc-400 mb-1">
                      Comprobante (foto)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(idx, e.target.files?.[0])}
                      className="w-full p-2 rounded bg-zinc-700 text-white outline-none file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-zinc-600 file:text-white"
                    />
                  </div>

                  {/* Vista previa */}
                  {receiptPreview && (
                    <div className="md:col-span-4">
                      <label className="block text-xs text-zinc-400 mb-1">Vista previa</label>
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
                {v.amount ? `≈ ${currencyFmt.format(parseFloat(v.amount || "0") || 0)}` : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total de valores */}
      <div className="text-right text-sm text-white">
        Total valores:{" "}
        <strong>{currencyFmt.format(totalValues)}</strong>
      </div>
    </div>
  );
}

function RadioPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded text-center ${
        selected ? "bg-emerald-500 text-black" : "bg-zinc-700 text-white"
      }`}
    >
      {label}
    </button>
  );
}
