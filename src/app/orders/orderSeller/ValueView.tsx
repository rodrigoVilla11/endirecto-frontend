"use client";

import React, { useMemo, useState } from "react";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";

type PaymentMethod = "efectivo" | "transferencia" | "cheque";

export type ValueItem = {
  amount: string;
  selectedReason: string; // Concepto / motivo
  method: PaymentMethod;
  bank?: string;
  /** URL del comprobante en Cloudinary */
  receipt?: string;
  /** Nombre original del archivo subido */
  receiptOriginalName?: string;
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

  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const addRow = () => {
    setNewValues((prev) => [
      {
        amount: "",
        selectedReason: "",
        method: "efectivo",
        bank: "",
        receipt: undefined,
        receiptOriginalName: undefined,
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
        clone[idx].receiptOriginalName = undefined;
      }
      return clone;
    });
  };

  const extractCloudinaryUrl = (res: any) =>
    res?.secure_url ??
    res?.url ??
    res?.data?.secure_url ??
    res?.data?.url ??
    null;

  // Sube a Cloudinary APENAS se elige un archivo y guarda el URL (string)
  const handleFileChange = async (idx: number, file?: File) => {
    if (!file) {
      updateRow(idx, { receipt: undefined, receiptOriginalName: undefined });
      return;
    }
    try {
      setUploadingIdx(idx);
      const res = await uploadImage(file).unwrap();
      const url = extractCloudinaryUrl(res);
      console.log("url")
      if (!url) throw new Error("No vino secure_url/url en la respuesta");
      updateRow(idx, { receipt: url, receiptOriginalName: file.name });
    } catch (e) {
      console.error("Upload error:", e);
      alert("No se pudo subir el comprobante. Probá de nuevo.");
      updateRow(idx, { receipt: undefined, receiptOriginalName: undefined });
    } finally {
      setUploadingIdx(null);
    }
  };

  const isImageUrl = (url?: string) =>
    !!url && /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(url);

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
          const isThisUploading = uploadingIdx === idx && isUploading;

          return (
            <div
              key={idx}
              className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/50"
            >
              {/* Fila principal */}
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

                  {/* Comprobante: input que sube automáticamente */}
                  <div className="md:col-span-4">
                    <label className="block text-xs text-zinc-400 mb-1">
                      Comprobante (imagen / PDF)
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(idx, e.target.files?.[0])}
                      className="w-full h-10 px-3 rounded bg-zinc-700 text-white outline-none file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-zinc-600 file:text-white"
                    />

                    <div className="mt-2 flex gap-2 items-center">
                      <span
                        className={`text-xs ${
                          isThisUploading ? "text-amber-400" : "text-zinc-400"
                        }`}
                      >
                        {isThisUploading
                          ? "Subiendo..."
                          : v.receipt
                          ? "Subida lista"
                          : "Sin comprobante"}
                      </span>

                      {v.receipt && (
                        <a
                          href={v.receipt}
                          target="_blank"
                          rel="noreferrer"
                          className="h-9 px-3 rounded bg-zinc-700 text-white flex items-center hover:bg-zinc-600"
                        >
                          Ver comprobante
                        </a>
                      )}

                      {v.receipt && (
                        <button
                          type="button"
                          onClick={() =>
                            updateRow(idx, {
                              receipt: undefined,
                              receiptOriginalName: undefined,
                            })
                          }
                          className="h-9 px-3 rounded bg-zinc-700 text-white hover:bg-zinc-600"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    {v.receiptOriginalName && (
                      <div className="text-xs text-zinc-400 mt-1">
                        Archivo: {v.receiptOriginalName}
                      </div>
                    )}
                  </div>

                  {/* Vista previa sólo si es imagen */}
                  {isImageUrl(v.receipt) && (
                    <div className="md:col-span-4">
                      <label className="block text-xs text-zinc-400 mb-1">
                        Vista previa
                      </label>
                      <div className="h-[120px] rounded overflow-hidden border border-zinc-700 bg-black/30 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.receipt as string}
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
