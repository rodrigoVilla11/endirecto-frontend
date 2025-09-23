"use client";

import { diffFromTodayToDate } from "@/lib/dateUtils";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
};

export default function ValueView({
  newValues,
  setNewValues,
  /** tasa anual (ej: 96) */
  annualInterestPct,
  /** suma con signo de ajustes por documentos (+desc / -rec) */
  docAdjustmentSigned = 0,
  /** total a pagar (neto) calculado por los documentos */
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
  const needsBank = (m: PaymentMethod) =>
    m === "cheque" || m === "transferencia";
  // Errores por fila (true = hay error)
  const rowErrors = newValues.map((v) => {
    const bankErr = needsBank(v.method) && !(v.bank || "").trim();
    const chequeNumErr =
      v.method === "cheque" && !(v.chequeNumber || "").trim();

    // ✅ Monto requerido (> 0). En cheque se valida el monto ORIGINAL (rawAmount)
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

  const addRow = () => {
    setNewValues((prev) => [
      {
        amount: "",
        rawAmount: "",
        selectedReason: NO_CONCEPTO,
        method: "efectivo",
        bank: "",
        chequeDate: "",
        chequeNumber: "",
      },
      ...prev,
    ]);
  };

  const removeRow = (idx: number) => {
    setNewValues((prev) => prev.filter((_, i) => i !== idx));
  };

  const patchRow = (idx: number, patch: Partial<ValueItem>) => {
    setNewValues((prev) => {
      const clone = [...prev];
      const merged = { ...clone[idx], ...patch };

      // 👇 si no hay concepto, forzamos "No Concepto"
      if (!merged.selectedReason?.trim()) {
        merged.selectedReason = NO_CONCEPTO;
      }

      clone[idx] = merged;
      return clone;
    });
  };
  // ======= Cálculos de interés simple para cheques =======
  const dailyRate = useMemo(
    () => annualInterestPct / 100 / 365,
    [annualInterestPct]
  );

  const daysBetweenToday = (iso?: string) => diffFromTodayToDate(iso);

  /** Días que generan interés (aplica gracia) */
  const chargeableDays = (iso?: string) => {
    const days = daysBetweenToday(iso);
    return Math.max(0, days - (chequeGraceDays ?? 0));
  };

  /** Interés $ sobre el monto ORIGINAL del cheque */
  const chequeInterest = (v: ValueItem) => {
    if (v.method !== "cheque") return 0;
    const base = parseFloat((v.rawAmount ?? v.amount) || "0") || 0;
    if (!base) return 0;
    const days = chargeableDays(v.chequeDate);
    const pct = dailyRate * days; // proporción acumulada
    return +(base * pct).toFixed(2);
  };

  /** Neto imputable desde monto ORIGINAL (rawAmount) */
  const computeChequeNeto = (raw: string, iso?: string) => {
    const base = parseFloat(raw || "0") || 0;
    const int$ = +(base * (dailyRate * chargeableDays(iso))).toFixed(2);
    const neto = Math.max(0, +(base - int$).toFixed(2));
    return { neto, int$ };
  };

  /** Valor efectivo imputable (para otros medios = amount; para cheques ya es neto) */
  const effectiveValue = (v: ValueItem) => parseFloat(v.amount || "0") || 0;

  // ======= Normalización automática del estado (clave) =======
  // Mantiene amount (imputable) = neto para todos los cheques
  useEffect(() => {
    let changed = false;
    const next = newValues.map((v) => {
      if (v.method !== "cheque") return v;
      const raw = v.rawAmount ?? v.amount ?? "0";
      const { neto } = computeChequeNeto(raw, v.chequeDate);
      const current = parseFloat(v.amount || "0") || 0;
      if (Math.abs(current - neto) > 0.009 || v.rawAmount == null) {
        changed = true;
        return { ...v, rawAmount: raw, amount: neto.toFixed(2) };
      }
      return v;
    });
    if (changed) setNewValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newValues, dailyRate, chequeGraceDays]);

  // ======= Totales =======
  const totalValues = useMemo(
    () => newValues.reduce((acc, v) => acc + effectiveValue(v), 0),
    [newValues]
  );

  const recargoChequesTotal = useMemo(
    () => newValues.reduce((acc, v) => acc + chequeInterest(v), 0),
    [newValues, dailyRate, chequeGraceDays]
  );

  const totalDtosRecargo = useMemo(
    () => +(docAdjustmentSigned + recargoChequesTotal).toFixed(2),
    [docAdjustmentSigned, recargoChequesTotal]
  );

  const saldo = useMemo(
    () => +(netToPay - totalValues).toFixed(2),
    [netToPay, totalValues]
  );

  // ======= Handlers =======
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
      patchRow(idx, { method, rawAmount: undefined }); // amount ya es imputable
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
          const showBank =
            v.method === "transferencia" || v.method === "cheque";

          const daysTotal = daysBetweenToday(v.chequeDate);
          const daysGrav =
            v.method === "cheque" ? chargeableDays(v.chequeDate) : 0;
          const pctInt = v.method === "cheque" ? dailyRate * daysGrav : 0;
          const interest$ = v.method === "cheque" ? chequeInterest(v) : 0;

          // En el input de cheque mostramos el monto ORIGINAL (rawAmount)
          const shownAmountInput =
            v.method === "cheque" ? v.rawAmount ?? v.amount : v.amount;

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
                {/* Medio de pago */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Medio de pago
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

                {/* Monto */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    {v.method === "cheque" ? "Monto original" : "Monto"}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0.00"
                    value={shownAmountInput}
                    onChange={(e) => handleAmountChange(idx, e.target.value, v)}
                    className={`w-full h-10 px-3 rounded text-white outline-none tabular-nums
    ${
      rowErrors[idx].amount
        ? "bg-zinc-700 border border-red-500"
        : "bg-zinc-700 border border-transparent"
    }`}
                  />
                  {rowErrors[idx].amount && (
                    <div className="mt-1 text-[11px] text-red-500">
                      {v.method === "cheque"
                        ? t("document.montoOriginalRequerido") ||
                          "Monto original requerido"
                        : t("document.montoRequerido") || "Monto requerido"}
                    </div>
                  )}
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
                    onChange={(e) => {
                      const val = e.target.value;
                      patchRow(idx, {
                        selectedReason: val.trim() === "" ? NO_CONCEPTO : val,
                      });
                    }}
                    className="w-full h-10 px-3 rounded bg-zinc-700 text-white outline-none"
                  />
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
              {showBank && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
                  {/* Banco */}
                  <div className="md:col-span-4">
                    <label className="block text-xs text-zinc-400 mb-1">
                      {t("document.banco") || "Banco"}
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Banco Galicia"
                      value={v.bank || ""}
                      onChange={(e) => patchRow(idx, { bank: e.target.value })}
                      className={`w-full h-10 px-3 rounded text-white outline-none
      ${
        rowErrors[idx].bank
          ? "bg-zinc-700 border border-red-500"
          : "bg-zinc-700 border border-transparent"
      }`}
                    />
                    {rowErrors[idx].bank && (
                      <div className="mt-1 text-[11px] text-red-500">
                        {t("document.bancoRequerido") || "Banco requerido"}
                      </div>
                    )}
                  </div>

                  {/* Solo cheques: fecha + métricas */}
                  {v.method === "cheque" && (
                    <>
                      <div className="md:col-span-3">
                        <label className="block text-xs text-zinc-400 mb-1">
                          {t("document.fechaCobro") || "Fecha de cobro"}
                        </label>
                        <input
                          type="date"
                          value={v.chequeDate || ""}
                          onChange={(e) =>
                            handleChequeDateChange(idx, e.target.value, v)
                          }
                          className="w-full h-10 px-3 rounded bg-zinc-700 text-white outline-none"
                        />
                        <div className="mt-1 text-[10px] text-zinc-500">
                          Días totales: {daysTotal} · Gracia: {chequeGraceDays}
                        </div>
                      </div>

                      {/* 👇 N° de cheque */}
                      <div className="md:col-span-5">
                        <label className="block text-xs text-zinc-400 mb-1">
                          {t("document.numeroCheque") || "N° de cheque"}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Ej: 00012345"
                          value={v.chequeNumber || ""}
                          onChange={(e) =>
                            patchRow(idx, {
                              // solo dígitos, hasta 20 chars
                              chequeNumber: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 20),
                            })
                          }
                          required
                          aria-invalid={
                            rowErrors[idx].chequeNumber ? true : false
                          }
                          className={`w-full h-10 px-3 rounded text-white outline-none tabular-nums
          ${
            rowErrors[idx].chequeNumber
              ? "bg-zinc-700 border border-red-500"
              : "bg-zinc-700 border border-transparent"
          }`}
                          autoComplete="off"
                        />
                        {rowErrors[idx].chequeNumber && (
                          <div className="mt-1 text-[11px] text-red-500">
                            {t("document.numeroChequeRequerido") ||
                              "N° de cheque requerido"}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Resumen por ítem */}
              <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm">
                  {/* Valor (cheque usa monto ORIGINAL) */}
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Valor</span>
                    <span className="text-white tabular-nums">
                      {currencyFmt.format(
                        v.method === "cheque"
                          ? parseFloat(v.rawAmount || v.amount || "0") || 0
                          : parseFloat(v.amount || "0") || 0
                      )}
                    </span>
                  </div>

                  {/* Días (solo se muestra si es cheque) */}
                  {v.method === "cheque" && (
                    <div className="flex justify-between">
                      <span className="text-zinc-300">Días</span>
                      <span className="text-white tabular-nums">
                        {Number.isFinite(daysTotal) ? daysTotal : "—"}
                      </span>
                    </div>
                  )}

                  {/* % (solo cheque; calculado sobre días gravados) */}
                  {v.method === "cheque" && (
                    <div className="flex justify-between">
                      <span className="text-zinc-300">%</span>
                      <span className="text-rose-400 tabular-nums">
                        {fmtPctSigned(pctInt)}
                      </span>
                    </div>
                  )}

                  {/* Costo financiero (solo cheque) */}
                  {v.method === "cheque" && (
                    <div className="flex justify-between">
                      <span className="text-zinc-300">Costo financiero</span>
                      <span className="text-rose-400 tabular-nums">
                        {currencyFmt.format(interest$)}
                      </span>
                    </div>
                  )}

                  {/* Valor Neto (siempre; en cheque = original - costo) */}
                  <div className="flex justify-between sm:col-span-2">
                    <span className="text-zinc-300 font-medium">
                      Valor Neto
                    </span>
                    <span className="text-white font-medium tabular-nums">
                      {currencyFmt.format(parseFloat(v.amount || "0") || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* ======= Resumen inferior (lista de ítems) ======= */}
      {newValues.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-sm text-zinc-300 font-semibold">
            Resumen de valores
          </div>

          <div className="space-y-2">
            {newValues.map((v, i) => {
              const isCheque = v.method === "cheque";
              const isTransf = v.method === "transferencia";
              const valorOriginal = isCheque
                ? parseFloat(v.rawAmount || v.amount || "0") || 0
                : undefined;
              const neto = parseFloat(v.amount || "0") || 0;
              const daysTotal = isCheque
                ? daysBetweenToday(v.chequeDate)
                : undefined;
              const daysGrav = isCheque
                ? chargeableDays(v.chequeDate)
                : undefined;
              const pctInt = isCheque ? dailyRate * (daysGrav || 0) : undefined;
              const interest$ = isCheque ? chequeInterest(v) : undefined;

              return (
                <div
                  key={`resumen-${i}`}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-200 font-medium">
                      {i + 1}. {labelMedio(v.method)}
                    </div>
                    <div className="text-sm text-white tabular-nums">
                      {currencyFmt.format(neto)}
                    </div>
                  </div>

                  {/* Campos por tipo */}
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-1 text-[13px]">
                    {/* Efectivo */}
                    {v.method === "efectivo" && (
                      <>
                        <ResumenKV k="Monto" v={currencyFmt.format(neto)} />
                        <ResumenKV
                          k="Concepto"
                          v={v.selectedReason || NO_CONCEPTO}
                        />
                      </>
                    )}

                    {/* Transferencia */}
                    {isTransf && (
                      <>
                        <ResumenKV k="Monto" v={currencyFmt.format(neto)} />
                        <ResumenKV
                          k="Banco"
                          v={(v.bank || "").trim() || "—"}
                          error={rowErrors[i].bank}
                        />
                        <ResumenKV k="Comprobante" v="—" muted />
                        <ResumenKV
                          k="Concepto"
                          v={v.selectedReason || NO_CONCEPTO}
                        />
                      </>
                    )}

                    {/* Cheque */}
                    {isCheque && (
                      <>
                        <ResumenKV
                          k="Monto (original)"
                          v={currencyFmt.format(valorOriginal || 0)}
                        />
                        <ResumenKV
                          k="Banco/Suc."
                          v={(v.bank || "").trim() || "—"}
                          error={rowErrors[i].bank}
                        />
                        <ResumenKV
                          k="N° de cheque"
                          v={(v.chequeNumber || "").trim() || "—"}
                          error={rowErrors[i].chequeNumber}
                        />
                        <ResumenKV k="Fecha cobro" v={v.chequeDate || "—"} />
                        <ResumenKV k="Comprobante" v="—" muted />
                        <ResumenKV
                          k="Concepto"
                          v={v.selectedReason || NO_CONCEPTO}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Resumen inferior */}
      <div className="mt-4 space-y-1 text-sm">
        <RowSummary
          label="TOTAL PAGADO"
          value={currencyFmt.format(totalValues)}
          bold
        />
        <RowSummary
          label="REC S/CHEQUES"
          value={currencyFmt.format(recargoChequesTotal)}
        />
        <RowSummary
          label="TOTAL DTOS/RECARGO"
          value={currencyFmt.format(totalDtosRecargo)}
        />
        <RowSummary
          label="SALDO"
          value={currencyFmt.format(saldo)}
          highlight={saldo === 0 ? "ok" : saldo < 0 ? "bad" : "warn"}
        />
      </div>

      {hasErrors && (
        <div className="mt-3 text-sm text-red-400">
          {t("document.hayErroresEnValores") ||
            "Hay errores en los valores cargados"}
        </div>
      )}
    </div>
  );
}

const fmtPctSigned = (p: number) =>
  `${p >= 0 ? "+" : ""}${(p * 100).toFixed(1)}%`;

/* ================== UI helpers ================== */
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

function RowSummary({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
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
function labelMedio(m: PaymentMethod) {
  if (m === "efectivo") return "EFECTIVO";
  if (m === "transferencia") return "TRANSFERENCIA";
  return "CHEQUE";
}

function ResumenKV({
  k,
  v,
  strong,
  warn,
  muted,
  error,
}: {
  k: string;
  v: string;
  strong?: boolean;
  warn?: boolean;
  muted?: boolean;
  error?: boolean;
}) {
  const vColor = error
    ? "text-red-400"
    : warn
    ? "text-rose-400"
    : muted
    ? "text-zinc-500"
    : "text-white";
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-400">{k}</span>
      <span className={`tabular-nums ${vColor} ${strong ? "font-medium" : ""}`}>
        {v}
      </span>
    </div>
  );
}
