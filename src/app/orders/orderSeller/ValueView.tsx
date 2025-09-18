"use client";

import { diffFromTodayToDate } from "@/lib/dateUtils";
import React, { useEffect, useMemo, useState } from "react";

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
  chequeGraceDays = 10,
}: {
  newValues: ValueItem[];
  setNewValues: React.Dispatch<React.SetStateAction<ValueItem[]>>;
  annualInterestPct: number;
  docAdjustmentSigned?: number;
  netToPay?: number;
  chequeGraceDays?: number;
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
        rawAmount: "",
        selectedReason: "",
        method: "efectivo",
        bank: "",
        chequeDate: "",
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
      clone[idx] = { ...clone[idx], ...patch };
      return clone;
    });
  };

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function toLocalMidnightUTC(d: Date) {
    // Normaliza a medianoche local y devuelve timestamp UTC
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function parseISOAsLocal(iso?: string): Date | null {
    if (!iso) return null;
    // <input type="date" /> => 'YYYY-MM-DD' (sin zona)
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [, y, mo, d] = m;
      return new Date(Number(y), Number(mo) - 1, Number(d)); // medianoche LOCAL
    }
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

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
                      patchRow(idx, { selectedReason: e.target.value })
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
                      onClick={() => handleMethodChange(idx, "efectivo", v)}
                      className="min-w-[8.5rem]"
                    />
                    <RadioPill
                      label="Transferencia"
                      selected={v.method === "transferencia"}
                      onClick={() =>
                        handleMethodChange(idx, "transferencia", v)
                      }
                      className="min-w-[9.5rem]"
                    />
                    <RadioPill
                      label="Cheque"
                      selected={v.method === "cheque"}
                      onClick={() => handleMethodChange(idx, "cheque", v)}
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
              {showBank && (
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
                      onChange={(e) => patchRow(idx, { bank: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-zinc-700 text-white outline-none"
                    />
                  </div>

                  {/* Solo cheques: fecha + métricas */}
                  {v.method === "cheque" && (
                    <>
                      <div className="md:col-span-3">
                        <label className="block text-xs text-zinc-400 mb-1">
                          Fecha de cobro
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

                      {/* <div className="md:col-span-5 grid grid-cols-4 gap-3">
                        <Metric label="DÍAS GRAV." value={String(daysGrav)} />
                        <Metric label="% INT" value={`${(pctInt * 100).toFixed(1)}%`} />
                        <Metric label="REC" value={currencyFmt.format(interest$)} />
                        <Metric
                          label="IMP."
                          value={currencyFmt.format(parseFloat(v.amount || "0") || 0)}
                        />
                      </div> */}
                    </>
                  )}
                </div>
              )}

              {/* Pie: valor imputable */}
              <div className="mt-3 text-xs text-zinc-400">
                {`Imputa ≈ ${currencyFmt.format(
                  parseFloat(v.amount || "0") || 0
                )}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen inferior
      <div className="mt-4 space-y-1 text-sm">
        <RowSummary label="TOTAL PAGADO" value={currencyFmt.format(totalValues)} bold />
        <RowSummary label="REC S/CHEQUES" value={currencyFmt.format(recargoChequesTotal)} />
        <RowSummary
          label="TOTAL DTOS/RECARGO"
          value={currencyFmt.format(totalDtosRecargo)}
        />
        <RowSummary
          label="SALDO"
          value={currencyFmt.format(saldo)}
          highlight={saldo === 0 ? "ok" : saldo < 0 ? "bad" : "warn"}
        />
      </div> */}
    </div>
  );
}

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-700 p-2 text-center">
      <div className="text-[10px] text-zinc-400">{label}</div>
      <div className="text-white tabular-nums">{value}</div>
    </div>
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
