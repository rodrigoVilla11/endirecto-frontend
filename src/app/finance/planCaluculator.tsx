"use client";

import React, { useMemo, useState } from "react";
import { useGetInterestRateQuery } from "@/redux/services/settingsApi";
import { diffFromTodayToDate } from "@/lib/dateUtils";

/* ===== Helpers de fecha (sin sorpresas de timezone) ===== */
const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Suma días calendario manteniendo medianoche local */
function addDaysLocal(dateISO: string, days: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const d0 = new Date(y, (m ?? 1) - 1, d ?? 1);
  const d1 = new Date(d0);
  d1.setDate(d0.getDate() + days);
  return toYMD(d1);
}

/* ===== Matemática (idéntica a ChequeCalculator) ===== */
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** tasa diaria desde tasa anual (%) */
const dailyRateFromAnnual = (annualInterestPct: number) =>
  annualInterestPct / 100 / 365;

/** días (HOY → chequeISO) y días gravados con gracia */
function getChequeDays(chequeISO?: string, graceDays = 45) {
  const daysTotal = diffFromTodayToDate(chequeISO) || 0;
  const daysCharged = Math.max(0, daysTotal - graceDays);
  return { daysTotal, daysCharged };
}

/**
 * PV = Σ [ C / (1 + i_diaria * días_grav_k) ]  ⇒  C = PV / Σ [ 1 / (1 + i*d_k) ]
 * - i_diaria = (annual/100)/365
 * - días_grav_k = max(0, días_totales(HOY->cheque_k) - graceDays)
 */
function computeEqualChequeAmountFromISOs(params: {
  presentValue: number;
  chequeDatesISO: string[];
  annualInterestPct: number;
  graceDays?: number;
}) {
  const {
    presentValue: PV,
    chequeDatesISO,
    annualInterestPct,
    graceDays = 45,
  } = params;
  if (PV <= 0 || chequeDatesISO.length === 0) return 0;

  const iDaily = dailyRateFromAnnual(annualInterestPct);
  let sumInvDf = 0;
  for (const iso of chequeDatesISO) {
    const { daysCharged } = getChequeDays(iso, graceDays);
    const df = 1 + iDaily * daysCharged; // interés simple (igual que ChequeCalculator)
    sumInvDf += 1 / df;
  }
  if (sumInvDf === 0) return 0;
  return round2(PV / sumInvDf);
}

/** Construye el cronograma mostrando % del período (informativo) */
function buildScheduleWithRates(params: {
  startISO: string;
  n: number;
  chequeValue: number;
  annualInterestPct: number;
  graceDays?: number;
}) {
  const {
    startISO,
    n,
    chequeValue,
    annualInterestPct,
    graceDays = 45,
  } = params;
  const iDaily = dailyRateFromAnnual(annualInterestPct);

  const items = [];
  for (let k = 1; k <= n; k++) {
    const days = 30 * k;
    const dateISO = addDaysLocal(startISO, days);
    const { daysTotal, daysCharged } = getChequeDays(dateISO, graceDays);
    const periodPct = iDaily * daysCharged * 100; // % simple del período (como ChequeCalculator)
    items.push({
      k,
      days,
      dateISO,
      daysTotal,
      daysCharged,
      amount: chequeValue,
      periodPct,
    });
  }
  return items;
}

/* ====== UI ====== */
export default function PlanCalculator({
  title = "Cálculo de pagos a plazo (30/60/90)",
  graceDays = 45, // misma gracia que usás en cheques
}: {
  title?: string;
  graceDays?: number;
}) {
  const { data: interestSetting } = useGetInterestRateQuery();

  // Tasa anual (misma fuente que usás en ChequeCalculator)
  const annualInterestPct =
    typeof interestSetting?.value === "number" ? interestSetting.value : 96;

  const [months, setMonths] = useState<number>(3); // 1..3
  const [startISO, setStartISO] = useState<string>(() => toYMD(new Date()));
  const [total, setTotal] = useState<string>("");

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const PV = parseFloat(total || "0") || 0;

  // Fechas reales de cada cheque (30/60/90 a partir de HOY/inicio)
  const chequeDates = useMemo(
    () =>
      Array.from({ length: months }, (_, i) =>
        addDaysLocal(startISO, 30 * (i + 1))
      ),
    [startISO, months]
  );

  // CUOTA igual calculada con la MISMA lógica que cheques
  const chequeValue = useMemo(
    () =>
      computeEqualChequeAmountFromISOs({
        presentValue: PV,
        chequeDatesISO: chequeDates,
        annualInterestPct,
        graceDays,
      }),
    [PV, chequeDates, annualInterestPct, graceDays]
  );

  const schedule = useMemo(
    () =>
      buildScheduleWithRates({
        startISO,
        n: months,
        chequeValue,
        annualInterestPct,
        graceDays,
      }),
    [startISO, months, chequeValue, annualInterestPct, graceDays]
  );

  const totalNominal = round2(chequeValue * (schedule.length || 0));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-gray-900 font-semibold">{title}</h4>
        <div className="text-xs text-white">
          Máximo 3 meses · cuotas iguales · Tasa anual:{" "}
          <span className="font-semibold">{annualInterestPct}%</span> · Gracia:{" "}
          <span className="font-semibold">{graceDays}</span> días
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
          <label className="block text-xs text-white mb-1">
            Importe total (PV)
          </label>
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

        {/* Informativo (no editable): muestra i_diaria y lógica usada */}
        <div>
          <label className="block text-xs text-white mb-1">TASA MENSUAL</label>
          <div className="w-full h-10 px-3 rounded-md bg-gray-100 text-gray-700 flex items-center border border-gray-300">
            {(dailyRateFromAnnual(annualInterestPct) * 30 * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="CUOTA / CHEQUE" value={fmt.format(chequeValue || 0)} />
        <Metric label="CANT. CHEQUES" value={String(schedule.length)} />
        <Metric label="TOTAL NOMINAL" value={fmt.format(totalNominal)} />
        <Metric label="TASA ANUAL" value={`${annualInterestPct.toFixed(2)}%`} />
      </div>

      <div className="rounded border border-zinc-200 overflow-hidden">
        <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200">
          Cronograma
        </div>

        <div className="hidden md:grid grid-cols-5 px-3 py-2 text-xs text-white">
          <span>Cheque</span>
          <span>Días totales</span>
          <span>Días gravados</span>
          <span>% período</span>
          <span>Fecha</span>
        </div>

        <div className="divide-y divide-zinc-200">
          {schedule.map((it) => (
            <div
              key={it.k}
              className="grid grid-cols-1 md:grid-cols-5 px-3 py-2 text-sm"
            >
              <div className="font-medium">{fmt.format(it.amount)}</div>
              <div className="text-white">{it.daysTotal}</div>
              <div className="text-white">{it.daysCharged}</div>
              <div className="text-white">{it.periodPct.toFixed(2)}%</div>
              <div className="text-white">{it.dateISO}</div>
            </div>
          ))}
          {schedule.length === 0 && (
            <div className="px-3 py-3 text-sm text-zinc-500">
              Configure los datos para ver el plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-center shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-gray-900 tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
