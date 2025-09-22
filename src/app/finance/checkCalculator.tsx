"use client";

import React, { useMemo, useState } from "react";
import { diffFromTodayToDate } from "@/lib/dateUtils";

/** Redondeo helper */
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Cálculo base: neto y recargo para UN cheque */
export function computeChequeNeto(params: {
  rawAmount: number;      // monto original del cheque
  chequeISO?: string;     // 'YYYY-MM-DD'
  annualInterestPct: number; // ej: 96
  graceDays?: number;     // ej: 45 (si no viene, abajo hacemos fallback)
}) {
  const { rawAmount, chequeISO, annualInterestPct, graceDays } = params;

  const dailyRate = annualInterestPct / 100 / 365;

  // días desde HOY a la fecha (tu util ya redondea por día calendario)
  const daysTotal = diffFromTodayToDate(chequeISO) || 0;

  // aplica gracia (fallback 45 si no viene)
  const g = Number.isFinite(graceDays as any) ? (graceDays as number) : 45;
  const daysChargeable = Math.max(0, daysTotal - g);

  // % acumulado simple
  const pct = dailyRate * daysChargeable;

  // recargo = base * pct, neto = base - recargo (no negativo)
  const recargo = round2(rawAmount * pct);
  const neto = Math.max(0, round2(rawAmount - recargo));

  return {
    daysTotal,
    daysChargeable,
    pct,      // proporción (0..1)
    recargo,  // $ sobre monto original
    neto,     // $ imputable
    graceUsed: g,
  };
}

/** Hook liviano para manejar estado + formato moneda */
export function useChequeCalc(
  annualInterestPct: number,
  graceDays?: number,             // 👈 ahora viene por prop (puede ser undefined)
  locale = "es-AR",
  currency = "ARS"
) {
  const [raw, setRaw] = useState<string>("");      // input: monto original
  const [dateISO, setDateISO] = useState<string>(""); // input: YYYY-MM-DD

  const currencyFmt = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale, currency]
  );

  const rawNumber = parseFloat(raw || "0") || 0;

  const calc = useMemo(
    () =>
      computeChequeNeto({
        rawAmount: rawNumber,
        chequeISO: dateISO,
        annualInterestPct,
        graceDays, // 👈 pasa lo que venga; adentro hace fallback a 45 si es undefined
      }),
    [rawNumber, dateISO, annualInterestPct, graceDays]
  );

  return {
    state: { raw, dateISO },
    setRaw,
    setDateISO,
    fmt: currencyFmt,
    ...calc, // incluye graceUsed
  };
}

/** Componente UI listo para usar */
export default function ChequeCalculator({
  annualInterestPct = 96,
  graceDays, // 👈 lo recibís desde afuera; puede venir undefined
  title = "Calculadora de Cheque",
}: {
  annualInterestPct?: number;
  graceDays?: number;
  title?: string;
}) {
  const {
    state: { raw, dateISO },
    setRaw,
    setDateISO,
    fmt,
    daysTotal,
    daysChargeable,
    pct,
    recargo,
    neto,
    graceUsed, // 👈 el valor de gracia realmente usado (con fallback aplicado)
  } = useChequeCalc(annualInterestPct, graceDays);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-gray-900 font-medium">{title}</h4>
        <div className="text-xs text-gray-500">
          Tasa anual: <span className="text-gray-900 font-semibold">{annualInterestPct}%</span>
          {" · "}Gracia: <span className="text-gray-900 font-semibold">{graceUsed}</span> días
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Monto original */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Monto original</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 outline-none border border-gray-300 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
          />
        </div>

        {/* Fecha de cobro */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha de cobro</label>
          <input
            type="date"
            value={dateISO}
            onChange={(e) => setDateISO(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 outline-none border border-gray-300 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
          />
          <div className="mt-1 text-[11px] text-gray-500">
            Días totales: <span className="text-emerald-600">{daysTotal}</span>{" "}
            · Gravados: <span className="text-emerald-600">{daysChargeable}</span>
          </div>
        </div>

        {/* Neto imputable */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Imputa aprox.</label>
          <div className="w-full h-10 px-3 rounded-md bg-gray-100 text-gray-900 flex items-center tabular-nums border border-gray-300">
            {fmt.format(neto || 0)}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="DÍAS GRAV." value={String(daysChargeable)} />
        <Metric label="% INT" value={`${(pct * 100).toFixed(2)}%`} />
        <Metric label="RECARGO" value={fmt.format(recargo || 0)} />
        <Metric label="NETO" value={fmt.format(neto || 0)} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-center shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-gray-900 tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
