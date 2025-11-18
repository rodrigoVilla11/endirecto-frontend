// components/ValueView/PaymentRow.tsx

import React, { useRef, useState } from "react";
import { ValueItem, PaymentMethod, RowErrors } from "./types/types";
import {
  formatInternalString,
  formatDigitsAsCurrencyAR,
  numberToDigitsStr,
  parseMaskedCurrencyToNumber,
} from "./utils/currencyUtils";
import { LabelWithTip } from "./LabelWithTip";
import { ChequeDetails } from "./ChequeDetails";

const MAX_FILE_MB = 15;

interface PaymentRowProps {
  index: number;
  value: ValueItem;
  rowError: RowErrors;
  isOpen: boolean;
  isSummaryOpen: boolean;
  needsBank: boolean;
  currencyFormatter: Intl.NumberFormat;
  isUploading: boolean;
  NO_CONCEPTO: string;
  
  // Datos del cheque
  daysTotal?: number;
  daysGrav?: number;
  pctInt?: number;
  interest$?: number;
  chequePromoRate?: number;
  chequePromoAmount?: number;
  
  // Callbacks
  onToggle: () => void;
  onToggleSummary: () => void;
  onRemove: () => void;
  onPatch: (patch: Partial<ValueItem>) => void;
  onMethodChange: (method: PaymentMethod) => void;
  onChequeDateChange: (iso: string) => void;
  onAmountChange: (input: string) => void;
  onUploadReceipt: (file: File) => Promise<void>;
  onClearReceipt: () => void;
}

export function PaymentRow({
  index,
  value: v,
  rowError,
  isOpen,
  isSummaryOpen,
  needsBank,
  currencyFormatter,
  isUploading,
  NO_CONCEPTO,
  daysTotal,
  daysGrav,
  pctInt,
  interest$,
  chequePromoRate,
  chequePromoAmount,
  onToggle,
  onToggleSummary,
  onRemove,
  onPatch,
  onMethodChange,
  onChequeDateChange,
  onAmountChange,
  onUploadReceipt,
  onClearReceipt,
}: PaymentRowProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  // Estado para edición enmascarada
  const [isEditing, setIsEditing] = useState(false);
  const [digitsByRow, setDigitsByRow] = useState("");
  const [draftText, setDraftText] = useState("");

  const hasRowError =
    rowError.amount ||
    rowError.bank ||
    rowError.chequeNumber ||
    rowError.chequeDate;

  const shownAmountInput =
    v.method === "cheque" ? v.raw_amount ?? v.amount : v.amount;

  const showBank = v.method === "transferencia" || v.method === "cheque";

  // Helpers para edición
  const startEdit = () => {
    const current = v.method === "cheque" ? v.raw_amount ?? v.amount : v.amount;
    const n = parseMaskedCurrencyToNumber(current ?? "");
    const digits = n === 0 ? "" : numberToDigitsStr(n);
    setDigitsByRow(digits);
    setDraftText(formatDigitsAsCurrencyAR(digits));
    setIsEditing(true);
  };

  const endEdit = () => {
    onAmountChange(draftText);
    setIsEditing(false);
    setDraftText("");
    setDigitsByRow("");
  };

  const applyMaskedEdit = (nextDigits: string) => {
    const masked = formatDigitsAsCurrencyAR(nextDigits);
    setDigitsByRow(nextDigits);
    setDraftText(masked);
    onAmountChange(masked);

    // Forzar caret al final
    if (inputRef.current) {
      requestAnimationFrame(() => {
        const len = masked.length;
        inputRef.current?.setSelectionRange(len, len);
      });
    }
  };

  const isImage = (url?: string) =>
    !!url && !url.toLowerCase().endsWith(".pdf");

  return (
    <div
      className={`rounded-lg bg-zinc-800/50 p-2 md:p-3 transition-colors
        ${hasRowError ? "border border-red-500" : "border border-zinc-700"}`}
    >
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        {/* Medio de pago */}
        <div className="w-full md:w-72">
          <label className="block text-[11px] text-zinc-400 mb-1">
            <LabelWithTip
              label="Medio de pago"
              tip="Seleccioná el medio de pago. Cheque y transferencia pueden requerir banco y otros datos."
            />
          </label>
          <select
            value={v.method}
            onChange={(e) => onMethodChange(e.target.value as PaymentMethod)}
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-2 py-1"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        {/* errores / expandir / eliminar */}
        <div className="flex items-center gap-2 md:ml-auto">
          {hasRowError && (
            <span className="text-[12px] text-red-400">
              Faltan datos en este pago
            </span>
          )}
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded
              ${
                isOpen
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-700/60 text-zinc-200"
              }
              hover:bg-zinc-600 transition`}
          >
            <svg
              viewBox="0 0 20 20"
              className={`w-4 h-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="currentColor"
            >
              <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 0 1 .94 1.17l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19z" />
            </svg>
          </button>

          <button
            onClick={onRemove}
            className="px-3 py-1.5 rounded bg-zinc-700 text-white hover:bg-zinc-600"
          >
            Eliminar
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* Monto */}
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              <LabelWithTip
                label={v.method === "cheque" ? "Monto Bruto" : "Monto"}
                tip={
                  v.method === "cheque"
                    ? "Monto Bruto del cheque ingresado por el usuario (antes del costo financiero)."
                    : "Suma de los pagos imputables cargados."
                }
              />
            </label>

            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              placeholder="$ 0,00"
              value={
                isEditing
                  ? draftText
                  : shownAmountInput?.trim()
                  ? formatInternalString(shownAmountInput)
                  : ""
              }
              onFocus={() => {
                startEdit();
                requestAnimationFrame(() => {
                  const masked = formatDigitsAsCurrencyAR(digitsByRow);
                  const el = inputRef.current;
                  if (el) {
                    const len = masked.length;
                    el.setSelectionRange(len, len);
                  }
                });
              }}
              onKeyDown={(e) => {
                const el = inputRef.current;
                const key = e.key;

                if (!isEditing) return;

                if (key === "Enter") {
                  e.preventDefault();
                  el?.blur();
                  return;
                }
                if (key === "Escape") {
                  e.preventDefault();
                  setIsEditing(false);
                  setDraftText("");
                  setDigitsByRow("");
                  return;
                }

                if (key === "Backspace") {
                  e.preventDefault();
                  const next = digitsByRow.slice(0, -1);
                  applyMaskedEdit(next);
                  return;
                }

                if (/^\d$/.test(key)) {
                  e.preventDefault();
                  const next = digitsByRow + key;
                  applyMaskedEdit(next);
                  return;
                }

                if (key.length === 1 && !/^\d$/.test(key)) {
                  e.preventDefault();
                }
              }}
              onChange={() => {}}
              onBlur={endEdit}
              className={`w-full px-2 py-1 rounded text-white outline-none tabular-nums
                ${
                  rowError.amount
                    ? "bg-zinc-700 border border-red-500"
                    : "bg-zinc-700 border border-transparent"
                }`}
            />
          </div>

          {/* N° de cheque */}
          {v.method === "cheque" && (
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                <LabelWithTip
                  label="N° de cheque"
                  tip="Número del cheque para trazabilidad."
                />
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={v.chequeNumber || ""}
                onChange={(e) =>
                  onPatch({
                    chequeNumber: e.target.value.replace(/\D/g, "").slice(0, 20),
                  })
                }
                className={`w-full px-2 py-1 rounded text-white outline-none tabular-nums
                  ${
                    rowError.chequeNumber
                      ? "bg-zinc-700 border border-red-500"
                      : "bg-zinc-700 border border-transparent"
                  }`}
              />
            </div>
          )}

          {/* Fecha de cobro */}
          {v.method === "cheque" && (
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                <LabelWithTip
                  label="Fecha de cobro"
                  tip="Fecha de cobro del cheque. Define los días totales y el costo financiero."
                />
              </label>
              <input
                type="date"
                required
                value={v.chequeDate || ""}
                onChange={(e) => onChequeDateChange(e.target.value)}
                className={`w-full px-2 py-1 rounded text-white outline-none
                  ${
                    rowError.chequeDate
                      ? "bg-zinc-700 border border-red-500"
                      : "bg-zinc-700 border border-transparent"
                  }`}
              />
              {daysTotal !== undefined && (
                <div className="mt-1 text-[10px] text-zinc-500">
                  Días totales: {daysTotal}
                </div>
              )}
            </div>
          )}

          {/* Banco */}
          {showBank && (
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                <LabelWithTip
                  label="Banco"
                  tip="Banco/Sucursal del pago. Requerido para cheque y transferencia."
                />
              </label>
              <input
                type="text"
                placeholder="Ej: Banco Galicia"
                value={v.bank || ""}
                onChange={(e) => onPatch({ bank: e.target.value })}
                className={`w-full px-2 py-1 rounded text-white outline-none
                  ${
                    rowError.bank
                      ? "bg-zinc-700 border border-red-500"
                      : "bg-zinc-700 border border-transparent"
                  }`}
              />
            </div>
          )}

          {/* Comprobante */}
          {showBank && (
            <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/40">
              <div className="flex items-center justify-between">
                <LabelWithTip
                  label="Comprobante"
                  tip="Adjuntá el comprobante de este pago (imagen o PDF). Máx. 15 MB."
                />
                <div className="text-xs text-zinc-500">
                  {v.receiptOriginalName ? v.receiptOriginalName : "Sin adjuntar"}
                </div>
              </div>

              <div className="mt-2 flex flex-col sm:flex-row gap-3 sm:items-center">
                <label className="inline-flex w-max cursor-pointer rounded px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-sm">
                  {v.receiptUrl
                    ? isUploading
                      ? "Subiendo..."
                      : "Reemplazar"
                    : isUploading
                    ? "Subiendo..."
                    : "Adjuntar"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.currentTarget.value = "";
                      if (!file) return;

                      if (file.size > MAX_FILE_MB * 1024 * 1024) {
                        alert(`El archivo supera ${MAX_FILE_MB} MB.`);
                        return;
                      }
                      if (
                        !(
                          file.type.startsWith("image/") ||
                          file.type === "application/pdf"
                        )
                      ) {
                        alert("Formato no soportado. Usá imagen o PDF.");
                        return;
                      }

                      await onUploadReceipt(file);
                    }}
                  />
                </label>

                {v.receiptUrl && (
                  <button
                    type="button"
                    onClick={onClearReceipt}
                    className="inline-flex w-max rounded px-3 py-1.5 border border-red-500 text-red-400 hover:bg-red-500/10 text-sm"
                    disabled={isUploading}
                  >
                    Quitar
                  </button>
                )}

                <div className="sm:ml-auto">
                  {v.receiptUrl ? (
                    <div className="flex items-center gap-3">
                      {isImage(v.receiptUrl) ? (
                        <img
                          src={v.receiptUrl}
                          alt={v.receiptOriginalName || "Comprobante"}
                          className="h-14 w-14 object-cover rounded border border-zinc-700"
                        />
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
                          PDF adjunto
                        </span>
                      )}
                      <a
                        href={v.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-300 underline break-all"
                      >
                        {v.receiptOriginalName || "Ver comprobante"}
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400">Sin comprobante</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Concepto */}
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              <LabelWithTip
                label="Concepto"
                tip="Detalle o referencia del pago (se usa para notas/comunicaciones)."
              />
            </label>
            <textarea
              rows={1}
              placeholder="Ej: Pago factura 001-0000123"
              value={v.selectedReason}
              onChange={(e) => {
                const val = e.target.value;
                onPatch({
                  selectedReason: val.trim() === "" ? NO_CONCEPTO : val,
                });
              }}
              className="w-full px-2 py-1 rounded bg-zinc-700 text-white outline-none resize-y"
            />
          </div>

          {/* Resumen por ítem */}
          {v.method === "cheque" && (
            <ChequeDetails
              isOpen={isSummaryOpen}
              onToggle={onToggleSummary}
              rawAmount={v.raw_amount || v.amount}
              amount={v.amount}
              daysTotal={daysTotal}
              pctInt={pctInt}
              interest$={interest$}
              chequePromoRate={chequePromoRate}
              chequePromoAmount={chequePromoAmount}
              currencyFormatter={currencyFormatter}
            />
          )}
        </div>
      )}
    </div>
  );
}