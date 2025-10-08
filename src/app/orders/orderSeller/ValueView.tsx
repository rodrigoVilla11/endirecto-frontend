//VALUEVIEW.tsx
"use client";

import { diffFromTodayToDate } from "@/lib/dateUtils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";

type PaymentMethod = "efectivo" | "transferencia" | "cheque";

export type ValueItem = {
  /** Monto imputable. Para cheques, es el NETO (original - interés). */
  amount: string;
  /** Solo cheques: monto original ingresado por el usuario. */
  rawAmount?: string;
  selectedReason: string;
  method: PaymentMethod;
  bank?: string;
  /** Solo cheques: fecha de cobro (YYYY-MM-DD) */
  chequeDate?: string;
  chequeNumber?: string;
  receiptUrl?: string;
  receiptOriginalName?: string;
};

export default function ValueView({
  newValues,
  setNewValues,
  /** tasa anual (ej: 96) */
  annualInterestPct,
  /** ajuste de documentos (+desc / -rec) que ves en PaymentModal */
  docAdjustmentSigned = 0,
  /** neto que ves en PaymentModal (usá totalNetForUI) */
  netToPay = 0,
  /** gracia para cheques (por defecto 45) */
  chequeGraceDays,
  onValidityChange,
}: {
  newValues: ValueItem[];
  setNewValues: React.Dispatch<React.SetStateAction<ValueItem[]>>;
  annualInterestPct: number;
  docAdjustmentSigned?: number;
  netToPay?: number;
  chequeGraceDays?: number;
  onValidityChange?: (isValid: boolean) => void;
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
  const { t } = useTranslation();
  const NO_CONCEPTO = t("document.noConcepto") || "Sin Concepto";
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();

  const needsBank = (m: PaymentMethod) =>
    m === "cheque" || m === "transferencia";

  // ===== Validación por fila =====
  const rowErrors = newValues.map((v) => {
    const bankErr = needsBank(v.method) && !(v.bank || "").trim();
    const chequeNumErr =
      v.method === "cheque" && !(v.chequeNumber || "").trim();
    // Monto requerido (> 0). En cheque se valida el ORIGINAL (rawAmount)
    const amountStr =
      v.method === "cheque" ? v.rawAmount ?? v.amount ?? "" : v.amount ?? "";
    const amountNum = parseFloat((amountStr || "").replace(",", "."));
    const amountErr = !Number.isFinite(amountNum) || amountNum <= 0;
    return { bank: bankErr, chequeNumber: chequeNumErr, amount: amountErr };
  });

  const hasErrors = rowErrors.some((e) => e.bank || e.chequeNumber || e.amount);
  useEffect(() => {
    onValidityChange?.(!hasErrors);
  }, [hasErrors, onValidityChange]);

  const toNum = (s?: string) =>
    Number.parseFloat((s ?? "").replace(",", ".")) || 0;

  /** Convierte cualquier input del usuario a un número en pesos con 2 decimales.
   *  Ej: "1234" -> 12.34 ; "1.234,5" -> 1234.50 ; "12,34" -> 12.34
   */
  const parseMaskedCurrencyToNumber = (raw: string): number => {
    const digits = (raw || "").replace(/\D/g, ""); // solo dígitos
    if (!digits) return 0;
    const cents = digits.slice(-2).padStart(2, "0"); // siempre 2 decimales
    const int = digits.slice(0, -2) || "0";
    return Number(`${int}.${cents}`);
  };

  /** Formatea número a moneda AR con 2 decimales, p.ej. "$ 1.232.312,00" */
  const formatCurrencyAR = (n: number, fmt: Intl.NumberFormat) =>
    n === 0 ? "$ 0,00" : fmt.format(n);

  /** Dado un string numérico interno (ej "1234.56") devuelve el texto formateado */
  const formatInternalString = (
    s: string | undefined,
    fmt: Intl.NumberFormat
  ) => formatCurrencyAR(Number(s || 0), fmt);

  const handleAmountChangeMasked = (
    idx: number,
    input: string,
    v: ValueItem
  ) => {
    const n = parseMaskedCurrencyToNumber(input); // número en pesos

    if (v.method !== "cheque") {
      // Guardamos internamente con punto decimal y 2 decimales
      patchRow(idx, { amount: n.toFixed(2), rawAmount: undefined });
      return;
    }

    // Para cheques, el input controla el "monto original" (rawAmount)
    const { neto } = computeChequeNeto(n.toFixed(2), v.chequeDate);
    patchRow(idx, {
      rawAmount: n.toFixed(2),
      amount: neto.toFixed(2),
    });
  };

  // ===== Cálculo interés simple cheques =====
  const dailyRate = useMemo(
    () => annualInterestPct / 100 / 365,
    [annualInterestPct]
  );
  const daysBetweenToday = (iso?: string) => diffFromTodayToDate(iso);

  /** Días gravados (aplica gracia; default 45) */
  const chargeableDays = (iso?: string) => {
    const days = daysBetweenToday(iso);
    const grace = chequeGraceDays ?? 45;
    return Math.max(0, days - grace);
  };

  /** Interés $ sobre monto ORIGINAL del cheque */
  const chequeInterest = (v: ValueItem) => {
    if (v.method !== "cheque") return 0;
    const base = toNum(v.rawAmount ?? v.amount);
    if (!base) return 0;
    const pct = dailyRate * chargeableDays(v.chequeDate);
    return +(base * pct).toFixed(2);
  };

  /** Neto imputable desde monto ORIGINAL (rawAmount) */
  const computeChequeNeto = (raw: string, iso?: string) => {
    const base = toNum(raw);
    const int$ = +(base * (dailyRate * chargeableDays(iso))).toFixed(2);
    const neto = Math.max(0, +(base - int$).toFixed(2));
    return { neto, int$ };
  };

  // ===== Normalización: en cheques, amount = neto =====
  useEffect(() => {
  let changed = false;
  const next = newValues.map((v) => {
    if (v.method !== "cheque") return v;
    
    // ✅ SOLO normalizar si rawAmount está undefined
    if (v.rawAmount == null || v.rawAmount === "") {
      const raw = v.amount ?? "0";
      changed = true;
      return { ...v, rawAmount: raw, amount: v.amount };
    }
    
    // ⚠️ Si ya tiene rawAmount, NO recalcular (respeta valores de refinanciación)
    return v;
  });
  
  if (changed) {
    setNewValues(next);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [newValues]);

  // ===== Totales =====
  const totalValues = useMemo(
    () => newValues.reduce((acc, v) => acc + toNum(v.amount), 0),
    [newValues]
  );

  const saldo = useMemo(
    () => +(netToPay - totalValues).toFixed(2),
    [netToPay, totalValues]
  );

  const isImage = (url?: string) =>
    !!url && !url.toLowerCase().endsWith(".pdf");

  // ===== Handlers =====

  const MAX_FILE_MB = 15;

  const clearReceipt = (idx: number) => {
    patchRow(idx, {
      receiptUrl: undefined,
      receiptOriginalName: undefined,
    });
  };

  const addRow = () => {
    setNewValues((prev) => {
      const next = [
        ...prev,
        {
          amount: "",
          rawAmount: "",
          selectedReason: NO_CONCEPTO,
          method: "efectivo" as PaymentMethod,
          bank: "",
          chequeDate: "",
          chequeNumber: "",
        },
      ];
      // abrir la nueva fila (último índice)
      setOpenRows((o) => ({ ...o, [next.length - 1]: true }));
      return next;
    });
  };

  const removeRow = (idx: number) => {
    setNewValues((prev) => prev.filter((_, i) => i !== idx));
  };

  const patchRow = (idx: number, patch: Partial<ValueItem>) => {
    setNewValues((prev) => {
      const clone = [...prev];
      const merged = { ...clone[idx], ...patch };
      if (!merged.selectedReason?.trim()) merged.selectedReason = NO_CONCEPTO;
      clone[idx] = merged;
      return clone;
    });
  };

  const handleAmountChange = (idx: number, value: string, v: ValueItem) => {
    if (v.method !== "cheque") {
      patchRow(idx, { amount: value, rawAmount: undefined });
      return;
    }
    const { neto } = computeChequeNeto(value, v.chequeDate);
    patchRow(idx, { rawAmount: value, amount: neto.toFixed(2) });
  };

  const handleMethodChange = (
    idx: number,
    method: PaymentMethod,
    v: ValueItem
  ) => {
    if (method !== "cheque") {
      patchRow(idx, { method, rawAmount: undefined });
      return;
    }
    const raw = v.rawAmount ?? v.amount ?? "0";
    const { neto } = computeChequeNeto(raw, v.chequeDate);
    patchRow(idx, { method, rawAmount: raw, amount: neto.toFixed(2) });
  };

  const handleChequeDateChange = (idx: number, iso: string, v: ValueItem) => {
    if (v.method !== "cheque") {
      patchRow(idx, { chequeDate: iso });
      return;
    }
    const raw = v.rawAmount ?? v.amount ?? "0";
    const { neto } = computeChequeNeto(raw, iso);
    patchRow(idx, { chequeDate: iso, rawAmount: raw, amount: neto.toFixed(2) });
  };

  const [openRows, setOpenRows] = useState<Record<number, boolean>>({});
  const isOpen = (i: number) => !!openRows[i];
  const toggleRow = (i: number) =>
    setOpenRows((prev) => ({ ...prev, [i]: !prev[i] }));

  const [summaryOpenRows, setSummaryOpenRows] = useState<
    Record<number, boolean>
  >({});
  const isSummaryOpen = (i: number) => !!summaryOpenRows[i];
  const toggleSummary = (i: number) =>
    setSummaryOpenRows((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium">Pagos</h4>
      </div>

      {newValues.length === 0 && (
        <div className="text-zinc-400 text-sm">No hay pagos cargados.</div>
      )}

      <div className="space-y-2">
        {newValues.map((v, idx) => {
          const showBank =
            v.method === "transferencia" || v.method === "cheque";
          const daysTotal = daysBetweenToday(v.chequeDate);
          const daysGrav =
            v.method === "cheque" ? chargeableDays(v.chequeDate) : 0;
          const pctInt = v.method === "cheque" ? dailyRate * daysGrav : 0;
          const interest$ = v.method === "cheque" ? chequeInterest(v) : 0;

          const shownAmountInput =
            v.method === "cheque" ? v.rawAmount ?? v.amount : v.amount;

          const hasRowError =
            rowErrors[idx].amount ||
            rowErrors[idx].bank ||
            rowErrors[idx].chequeNumber;

          return (
            <div
              key={idx}
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
                      tip={EXPLAIN.medioPago}
                    />
                  </label>
                  <select
                    value={v.method}
                    onChange={(e) =>
                      handleMethodChange(
                        idx,
                        e.target.value as PaymentMethod,
                        v
                      )
                    }
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
                    onClick={() => toggleRow(idx)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded
                ${
                  isOpen(idx)
                    ? "bg-zinc-700 text-white"
                    : "bg-zinc-700/60 text-zinc-200"
                }
                hover:bg-zinc-600 transition`}
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className={`w-4 h-4 transition-transform ${
                        isOpen(idx) ? "rotate-180" : ""
                      }`}
                      fill="currentColor"
                    >
                      <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 0 1 .94 1.17l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => removeRow(idx)}
                    className="px-3 py-1.5 rounded bg-zinc-700 text-white hover:bg-zinc-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {isOpen(idx) && (
                <div className="mt-3 space-y-3">
                  {/* Monto */}
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      <LabelWithTip
                        label={v.method === "cheque" ? "Monto Bruto" : "Monto"}
                        tip={
                          v.method === "cheque"
                            ? EXPLAIN.chequeMontoOriginal
                            : EXPLAIN.totalPagado
                        }
                      />
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="$ 0,00"
                      value={
                        shownAmountInput?.trim()
                          ? formatInternalString(shownAmountInput, currencyFmt)
                          : ""
                      }
                      onChange={(e) =>
                        handleAmountChangeMasked(idx, e.target.value, v)
                      }
                      className={`w-full px-2 py-1 rounded text-white outline-none tabular-nums
          ${
            rowErrors[idx].amount
              ? "bg-zinc-700 border border-red-500"
              : "bg-zinc-700 border border-transparent"
          }`}
                    />
                  </div>

                  {/* Solo cheques: N° de cheque */}
                  {v.method === "cheque" && (
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        <LabelWithTip
                          label={t("document.numeroCheque") || "N° de cheque"}
                          tip={EXPLAIN.numeroCheque}
                        />
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={v.chequeNumber || ""}
                        onChange={(e) =>
                          patchRow(idx, {
                            chequeNumber: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 20),
                          })
                        }
                        className={`w-full px-2 py-1 rounded text-white outline-none tabular-nums
            ${
              rowErrors[idx].chequeNumber
                ? "bg-zinc-700 border border-red-500"
                : "bg-zinc-700 border border-transparent"
            }`}
                      />
                    </div>
                  )}

                  {/* Solo cheques: Fecha de cobro */}
                  {v.method === "cheque" && (
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        <LabelWithTip
                          label={t("document.fechaCobro") || "Fecha de cobro"}
                          tip={EXPLAIN.fechaCobro}
                        />
                      </label>
                      <input
                        type="date"
                        value={v.chequeDate || ""}
                        onChange={(e) =>
                          handleChequeDateChange(idx, e.target.value, v)
                        }
                        className="w-full px-2 py-1 rounded bg-zinc-700 text-white outline-none"
                      />
                      <div className="mt-1 text-[10px] text-zinc-500">
                        <Tip
                          text={`${EXPLAIN.chequeDiasTotales} • ${EXPLAIN.chequeGracia}`}
                        >
                          Días totales: {daysTotal} · Gracia:{" "}
                          {chequeGraceDays ?? 45}
                        </Tip>
                      </div>
                    </div>
                  )}

                  {/* Solo cheques: Valor neto (read-only) */}
                  {v.method === "cheque" && (
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        <LabelWithTip
                          label="Monto neto"
                          tip="Monto que se imputa después de descontar el costo financiero (se recalcula al cambiar monto/fecha)."
                        />
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={currencyFmt.format(toNum(v.amount))}
                        className="w-full px-2 py-1 rounded bg-zinc-800 text-white outline-none tabular-nums border border-zinc-700"
                        title={currencyFmt.format(toNum(v.amount))}
                      />
                      <div className="mt-1 text-[10px] text-zinc-500">
                        Neto = Monto Bruto − Costo Financiero (%) •{" "}
                        {currencyFmt.format(toNum(v.rawAmount ?? v.amount))} −{" "}
                        {currencyFmt.format(interest$)}
                      </div>
                    </div>
                  )}

                  {/* Banco (si corresponde) */}
                  {showBank && (
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        <LabelWithTip
                          label={t("document.banco") || "Banco"}
                          tip={EXPLAIN.banco}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Banco Galicia"
                        value={v.bank || ""}
                        onChange={(e) =>
                          patchRow(idx, { bank: e.target.value })
                        }
                        className={`w-full px-2 py-1 rounded text-white outline-none
            ${
              rowErrors[idx].bank
                ? "bg-zinc-700 border border-red-500"
                : "bg-zinc-700 border border-transparent"
            }`}
                      />
                    </div>
                  )}

                  {/* Comprobante (si corresponde) */}
                  {showBank && (
                    <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/40">
                      <div className="flex items-center justify-between">
                        <LabelWithTip
                          label="Comprobante"
                          tip="Adjuntá el comprobante de este pago (imagen o PDF). Máx. 15 MB."
                        />
                        <div className="text-xs text-zinc-500">
                          {v.receiptOriginalName
                            ? v.receiptOriginalName
                            : "Sin adjuntar"}
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
                                alert(
                                  "Formato no soportado. Usá imagen o PDF."
                                );
                                return;
                              }

                              try {
                                const res = await uploadImage(file).unwrap();
                                const url =
                                  (res as any)?.secure_url ??
                                  (res as any)?.url ??
                                  (res as any)?.data?.secure_url ??
                                  (res as any)?.data?.url;
                                if (!url)
                                  throw new Error(
                                    "No se recibió URL del servidor."
                                  );

                                patchRow(idx, {
                                  receiptUrl: url,
                                  receiptOriginalName: file.name,
                                });
                              } catch (err) {
                                console.error(
                                  "Falló la subida del comprobante:",
                                  err
                                );
                                alert("No se pudo subir el comprobante.");
                              }
                            }}
                          />
                        </label>

                        {v.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => clearReceipt(idx)}
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
                            <div className="text-xs text-zinc-400">
                              Sin comprobante
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Concepto */}
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      <LabelWithTip label="Concepto" tip={EXPLAIN.concepto} />
                    </label>
                    <textarea
                      rows={1}
                      placeholder="Ej: Pago factura 001-0000123"
                      value={v.selectedReason}
                      onChange={(e) => {
                        const val = e.target.value;
                        patchRow(idx, {
                          selectedReason: val.trim() === "" ? NO_CONCEPTO : val,
                        });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-700 text-white outline-none resize-y"
                    />
                  </div>

                  {/* Resumen por ítem (una fila por item, expandible) */}
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
                    {/* encabezado con valor neto + toggle */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex justify-between text-sm">
                        <span className="text-zinc-300 font-medium">
                          Valor Neto
                        </span>
                        <span className="text-white font-medium tabular-nums">
                          {currencyFmt.format(toNum(v.amount))}
                        </span>
                      </div>

                      {/* botón toggle detalle (solo tiene sentido para cheques) */}
                      {v.method === "cheque" && (
                        <button
                          type="button"
                          onClick={() => toggleSummary(idx)}
                          className={`inline-flex items-center gap-1 text-xs rounded px-2 py-1 border 
          ${
            isSummaryOpen(idx)
              ? "border-zinc-500 text-zinc-200 bg-zinc-700"
              : "border-zinc-700 text-zinc-300 bg-zinc-800 hover:bg-zinc-700/60"
          }`}
                        >
                          {isSummaryOpen(idx) ? "Ocultar" : "Ver detalle"}
                          <svg
                            viewBox="0 0 20 20"
                            className={`w-3.5 h-3.5 transition-transform ${
                              isSummaryOpen(idx) ? "rotate-180" : ""
                            }`}
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 0 1 .94 1.17l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* detalle expandible (una fila por item) */}
                    {v.method === "cheque" && isSummaryOpen(idx) && (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-300">Valor Bruto</span>
                          <span className="text-white tabular-nums">
                            {currencyFmt.format(toNum(v.rawAmount || v.amount))}
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
                            {fmtPctSigned(pctInt)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-zinc-300">
                            Costo financiero
                          </span>
                          <span className="text-rose-400 tabular-nums">
                            {currencyFmt.format(interest$)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-end">
        <button
          onClick={addRow}
          className="px-3 py-2 rounded bg-emerald-500 text-black font-medium hover:brightness-95 active:scale-95"
        >
          + Agregar pago
        </button>
      </div>

     {newValues.length > 0 && (
  <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800/40 p-4">
    <div className="space-y-2 text-sm">
      {/* 1. Objetivo (documentos seleccionados con ajustes) */}
      <RowSummary
        label={
          <LabelWithTip 
            label="Objetivo (documentos)" 
            tip="Total a pagar según documentos seleccionados, ya con descuentos/recargos aplicados."
          />
        }
        value={currencyFmt.format(netToPay)}
        bold
      />

      {/* 2. Total pagado (suma de valores netos) */}
      <RowSummary
        label={
          <LabelWithTip 
            label="Total pagado" 
            tip="Suma de los pagos cargados. Para cheques se usa el monto neto (bruto menos costo financiero)."
          />
        }
        value={currencyFmt.format(totalValues)}
      />

      {/* 3. Divisor visual */}
      <div className="border-t border-zinc-700 my-2" />

      {/* 4. Diferencia (debe ser 0 para cerrar perfecto) */}
      <RowSummary
        label={
          <LabelWithTip 
            label="Diferencia" 
            tip="Objetivo menos total pagado. Debe ser $0 para que el pago cierre exacto."
          />
        }
        value={currencyFmt.format(saldo)}
        bold
        highlight={
          Math.abs(saldo) < 0.01 
            ? "ok"      // verde: cierra perfecto
            : saldo > 0 
            ? "warn"    // amarillo: falta cubrir
            : "bad"     // rojo: exceso
        }
      />

      {/* 5. Mensaje contextual */}
      {Math.abs(saldo) >= 0.01 && (
        <div className={`text-xs mt-2 px-2 py-1 rounded ${
          saldo > 0 
            ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
            : "bg-red-500/10 text-red-300 border border-red-500/30"
        }`}>
          {saldo > 0 
            ? `⚠️ Falta cubrir ${currencyFmt.format(saldo)}`
            : `❌ Exceso de ${currencyFmt.format(Math.abs(saldo))}`
          }
        </div>
      )}

      {Math.abs(saldo) < 0.01 && (
        <div className="text-xs mt-2 px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          ✅ Pago completo
        </div>
      )}
    </div>
  </div>
)}


      {hasErrors && (
        <div className="mt-3 text-sm text-red-400">
          {t("document.hayErroresEnValores") ||
            "Hay errores en los pagos cargados"}
        </div>
      )}
    </div>
  );
}

const fmtPctSigned = (p: number) =>
  `${p >= 0 ? "+" : ""}${(p * 100).toFixed(1)}%`;

/* ================== UI helpers ================== */

function RowSummary({
  label,
  value,
  bold,
  highlight,
}: {
  label: React.ReactNode;
  value: string;
  bold?: boolean;
  highlight?: "ok" | "bad" | "warn";
}) {
  const color =
    highlight === "ok"
      ? "text-emerald-500"
      : highlight === "bad"
      ? "text-red-500"
      : highlight === "warn"
      ? "text-amber-400"
      : "text-white";
  return (
    <div className="flex justify-between">
      <span className={`text-zinc-300 ${bold ? "font-semibold" : ""}`}>
        {label}
      </span>
      <span className={`${color} tabular-nums ${bold ? "font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function InfoIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.5a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0v-5zM10 6a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  );
}

/** Tooltip simple, accesible y sin dependencias */
/** Tooltip simple, accesible y sin dependencias (con clamp a viewport) */
function Tip({
  text,
  children,
  side = "top",
}: {
  text: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const pos =
    side === "top"
      ? "bottom-full mb-1 left-1/2"
      : side === "bottom"
      ? "top-full mt-1 left-1/2"
      : side === "left"
      ? "right-full mr-1 top-1/2"
      : "left-full ml-1 top-1/2";

  const tipRef = React.useRef<HTMLSpanElement>(null);
  const wrapRef = React.useRef<HTMLSpanElement>(null);

  const clampToViewport = () => {
    const tip = tipRef.current;
    if (!tip) return;

    // Reset al estado centrado antes de medir
    tip.style.transform =
      side === "left" || side === "right"
        ? "translateY(-50%)"
        : "translateX(-50%)";

    const r = tip.getBoundingClientRect();
    const vw = window.innerWidth;
    const margin = 8; // px

    if (side === "top" || side === "bottom") {
      // Si se sale por izquierda, empujamos a la derecha (valores +)
      // Si se sale por derecha, empujamos a la izquierda (valores -)
      let push = 0;
      if (r.left < margin) push = margin - r.left;
      if (r.right > vw - margin) push = -(r.right - (vw - margin));

      if (push !== 0) {
        // Ajustamos el translateX (-50% + push px)
        tip.style.transform = `translateX(calc(-50% + ${push}px))`;
      }
    } else {
      // Para left/right, clamp vertical si hace falta (opcional)
      // Aquí suele no ser problema, pero lo dejamos por simetría
      const vh = window.innerHeight;
      let pushY = 0;
      if (r.top < margin) pushY = margin - r.top;
      if (r.bottom > vh - margin) pushY = -(r.bottom - (vh - margin));
      if (pushY !== 0) {
        tip.style.transform = `translateY(calc(-50% + ${pushY}px))`;
      }
    }
  };

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex items-center gap-1 group"
      onMouseEnter={clampToViewport}
      onMouseMove={clampToViewport}
      onFocus={clampToViewport}
    >
      {children}
      <span
        ref={tipRef}
        role="tooltip"
        className={`
          pointer-events-none absolute ${pos} z-10
          min-w-[16rem] max-w-[min(32rem,calc(100vw-1rem))]
          rounded-md border border-zinc-700 bg-zinc-900
          px-3 py-1.5 text-sm text-zinc-200
          text-left whitespace-normal break-words
          opacity-0 shadow-lg transition-opacity duration-150
          group-hover:opacity-100 group-focus-within:opacity-100
          ${
            side === "left" || side === "right"
              ? "-translate-y-1/2"
              : "-translate-x-1/2"
          }
        `}
        title={text} // fallback nativo
      >
        {text}
      </span>
    </span>
  );
}

/** Etiqueta con ícono + tooltip */
function LabelWithTip({
  label,
  tip,
  side = "top",
  className = "",
}: {
  label: string;
  tip: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <Tip text={tip} side={side}>
      <span
        className={`inline-flex items-center gap-1 cursor-help ${className}`}
        tabIndex={0} // 👈 permite mostrar tooltip al focus (teclado)
      >
        <span>{label}</span>
        <InfoIcon className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
      </span>
    </Tip>
  );
}

/* ===== Textos de ayuda ===== */
const EXPLAIN = {
  totalPagado:
    "Suma de los pagos imputables cargados. Para cheques se toma el monto neto (monto bruto menos costo financiero).",
  dtoRecFact:
    "Ajuste por comprobantes según días y condición de pago: descuento (signo -) o recargo (signo +).",
  saldo:
    "Diferencia entre el total a pagar de documentos (neto) y los pagos imputados. Si es 0, el pago queda cubierto.",
  chequeMontoOriginal:
    "Monto Bruto del cheque ingresado por el usuario (antes del costo financiero).",
  chequeDiasTotales:
    "Días calendario desde hoy hasta la fecha de cobro del cheque.",
  chequeGracia:
    "Días de gracia durante los cuales no se cobra costo financiero. Pasado ese umbral, los días generan interés.",
  chequePorcentaje:
    "Porcentaje de interés simple acumulado: tasa diaria x días gravados.",
  chequeCostoFinanciero:
    "Costo Financiero en pesos aplicado al monto bruto del cheque (monto bruto x porcentaje).",
  chequeNeto: "Monto neto del cheque: monto bruto menos costo financiero.",
  medioPago:
    "Seleccioná el medio de pago. Cheque y transferencia pueden requerir banco y otros datos.",
  banco: "Banco/Sucursal del pago. Requerido para cheque y transferencia.",
  fechaCobro:
    "Fecha de cobro del cheque. Define los días totales y el costo financiero.",
  numeroCheque: "Número del cheque para trazabilidad.",
  concepto: "Detalle o referencia del pago (se usa para notas/comunicaciones).",
};
