"use client";

import React, { useMemo, useState } from "react";

/** --- Helpers de fechas (sin sorpresas por timezone) --- */
const pad2 = (n: number) => String(n).padStart(2, "0");
function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
/** Suma "days" días calendario (30/60/90) manteniendo medianoche local */
function addDaysLocal(dateISO: string, days: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const d0 = new Date(y, (m ?? 1) - 1, d ?? 1); // local midnight
  const d1 = new Date(d0);
  d1.setDate(d0.getDate() + days);
  return toYMD(d1);
}

/** Redondeo helper */
const round2 = (n: number) => Math.round(n * 100) / 100;

/** --- Cálculo: cuota fija (cheque) que cubre el PV a tasa mensual r --- */
function computeEqualChequeAmount(params: {
  presentValue: number; // Importe total del negocio (PV)
  monthlyRatePct: number; // Tasa mensual (%), ej 6.92
  months: number; // 1..3
}) {
  const { presentValue: PV, monthlyRatePct, months: n } = params;
  const r = monthlyRatePct / 100;
  if (n <= 0 || r < 0) return 0;
  const C = PV * r / (1 - Math.pow(1 + r, -n)); // fórmula de anualidad
  return round2(C);
}

/** Construye plan a 30/60/90 días (según n) */
function buildSchedule(params: {
  startISO: string; // fecha de inicio (hoy/emisión) YYYY-MM-DD
  n: number; // cheques/meses
  chequeValue: number;
}) {
  const { startISO, n, chequeValue } = params;
  const items = [];
  for (let k = 1; k <= n; k++) {
    const days = 30 * k;
    const dateISO = addDaysLocal(startISO, days);
    items.push({
      k,
      days,
      dateISO,
      amount: chequeValue,
    });
  }
  // Ajuste por redondeo: si querés que la suma de PV coincida exacto,
  // podés recalcular el último cheque; acá dejamos todos iguales por claridad.
  return items;
}

/** --- Hook de estado + formateo --- */
function usePlanCalc(
  locale = "es-AR",
  currency = "ARS"
) {
  const [total, setTotal] = useState<string>("");
  const [monthlyRate, setMonthlyRate] = useState<string>("6.92"); // %
  const [months, setMonths] = useState<number>(3); // 1..3
  const [startISO, setStartISO] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  });

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale, currency]
  );

  const PV = parseFloat(total || "0") || 0;
  const r = parseFloat(monthlyRate || "0") || 0;

  const chequeValue = useMemo(
    () =>
      computeEqualChequeAmount({
        presentValue: PV,
        monthlyRatePct: r,
        months,
      }),
    [PV, r, months]
  );

  const schedule = useMemo(
    () => buildSchedule({ startISO, n: months, chequeValue }),
    [startISO, months, chequeValue]
  );

  return {
    state: { total, monthlyRate, months, startISO },
    setTotal,
    setMonthlyRate,
    setMonths,
    setStartISO,
    fmt,
    chequeValue,
    schedule,
  };
}

/** --- UI --- */
export default function PlanCalculator({
  title = "Cálculo de pagos a plazo (30/60/90)",
}: {
  title?: string;
}) {
  const {
    state: { total, monthlyRate, months, startISO },
    setTotal,
    setMonthlyRate,
    setMonths,
    setStartISO,
    fmt,
    chequeValue,
    schedule,
  } = usePlanCalc();

  const totalNominal = round2(chequeValue * (schedule.length || 0));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-gray-900 font-semibold">{title}</h4>
        <div className="text-xs text-white">
          Máximo 3 meses · cuotas iguales
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-white mb-1">Fecha inicio</label>
          <input
            type="date"
            value={startISO}
            onChange={(e) => setStartISO(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-gray-50 text-gray-900 border border-gray-300 focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div>
          <label className="block text-xs text-white mb-1">Importe total (PV)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-gray-50 text-gray-900 border border-gray-300 focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div>
          <label className="block text-xs text-white mb-1">Meses (1–3)</label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-md bg-gray-50 text-gray-900 border border-gray-300 focus:ring-2 focus:ring-emerald-400"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-white mb-1">Tasa mensual (%)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={monthlyRate}
            onChange={(e) => setMonthlyRate(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-gray-50 text-gray-900 border border-gray-300 focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="CUOTA / CHEQUE" value={fmt.format(chequeValue || 0)} />
        <Metric label="CANT. CHEQUES" value={String(schedule.length)} />
        <Metric label="TOTAL NOMINAL" value={fmt.format(totalNominal)} />
        <Metric label="TASA MENSUAL" value={`${Number(monthlyRate || 0).toFixed(2)}%`} />
      </div>

      <div className="rounded border border-zinc-200 overflow-hidden">
        <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200">
          Cronograma
        </div>
        <div className="hidden md:grid grid-cols-3 px-3 py-2 text-xs text-white">
          <span>Cheque</span>
          <span>Días</span>
          <span>Fecha</span>
        </div>
        <div className="divide-y divide-zinc-200">
          {schedule.map((it) => (
            <div key={it.k} className="grid grid-cols-1 md:grid-cols-3 px-3 py-2 text-sm">
              <div className="font-medium">{fmt.format(it.amount)}</div>
              <div className="text-white">{it.days}</div>
              <div className="text-white">{it.dateISO}</div>
            </div>
          ))}
          {schedule.length === 0 && (
            <div className="px-3 py-3 text-sm text-zinc-500">Configure los datos para ver el plan.</div>
          )}
        </div>
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
