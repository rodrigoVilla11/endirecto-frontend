"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useGetInterestRateQuery } from "@/redux/services/settingsApi";
import { diffFromTodayToDate } from "@/lib/dateUtils";

/* ===== Helpers de fecha ===== */
const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function addDaysLocal(dateISO: string, days: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const d0 = new Date(y, (m ?? 1) - 1, d ?? 1);
  const d1 = new Date(d0);
  d1.setDate(d0.getDate() + days);
  return toYMD(d1);
}

/* ===== Matemática ===== */
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const dailyRateFromAnnual = (annualInterestPct: number) =>
  (annualInterestPct / 100) / 365;

function getChequeDays(chequeISO?: string, graceDays?: number) {
  const daysTotal = diffFromTodayToDate(chequeISO) || 0;
  const g = Number.isFinite(graceDays as any) ? (graceDays as number) : 0;
  const daysCharged = Math.max(0, daysTotal - g);
  return { daysTotal, daysCharged, graceUsed: g };
}

function computeEqualChequeAmountFromISOs(params: {
  presentValue: number;
  chequeDatesISO: string[];
  annualInterestPct: number;
  graceDays?: number;
}) {
  const { presentValue: PV, chequeDatesISO, annualInterestPct, graceDays } = params;
  if (PV <= 0 || chequeDatesISO.length === 0) return 0;

  const iDaily = dailyRateFromAnnual(annualInterestPct);
  let sumInvDf = 0;
  for (const iso of chequeDatesISO) {
    const { daysCharged } = getChequeDays(iso, graceDays);
    const df = 1 + iDaily * daysCharged; // interés simple
    sumInvDf += 1 / df;
  }
  if (sumInvDf === 0) return 0;
  return round2(PV / sumInvDf);
}

function buildScheduleWithRates(params: {
  startISO: string;
  n: number;
  chequeValue: number;
  annualInterestPct: number;
  graceDays?: number;
}) {
  const { startISO, n, chequeValue, annualInterestPct, graceDays } = params;
  const iDaily = dailyRateFromAnnual(annualInterestPct);

  const items = [];
  for (let k = 1; k <= n; k++) {
    const days = 30 * k;
    const dateISO = addDaysLocal(startISO, days);
    const { daysTotal, daysCharged, graceUsed } = getChequeDays(dateISO, graceDays);
    const periodPct = iDaily * daysCharged * 100;
    items.push({ k, days, dateISO, daysTotal, daysCharged, graceUsed, amount: chequeValue, periodPct });
  }
  return items;
}

/* ====== UI ====== */
export default function PlanCalculator({
  title = "Cálculo de pagos a plazo (30/60/90)",
  graceDays,
  initialTotal,                 // 👈 NUEVO
  onProposeCheques,            // 👈 NUEVO
}: {
  title?: string;
  graceDays?: number;
  initialTotal?: number;
  onProposeCheques?: (plan: {
    chequeValue: number;
    schedule: Array<{ k: number; dateISO: string; amount: number }>;
    months: number;
    presentValue: number;
    annualInterestPct: number;
    graceDays?: number;
  }) => void;
}) {
  const { data: interestSetting } = useGetInterestRateQuery();
  const annualInterestPct =
    typeof interestSetting?.value === "number" ? interestSetting.value : 96;

  const [months, setMonths] = useState<number>(3);
  const [startISO, setStartISO] = useState<string>(() => toYMD(new Date()));
  const [total, setTotal] = useState<string>("");

  // Prefill del total que viene del padre
  useEffect(() => {
    if (typeof initialTotal === "number" && isFinite(initialTotal)) {
      setTotal(String(round2(initialTotal)));
    }
  }, [initialTotal]);

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

  const chequeDates = useMemo(
    () => Array.from({ length: months }, (_, i) => addDaysLocal(startISO, 30 * (i + 1))),
    [startISO, months]
  );

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
  const graceUsedDisplay = Number.isFinite(graceDays as any) ? (graceDays as number) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-semibold">{title}</h4>
        <div className="text-xs text-white/80">
          Máx. 3 meses · cuotas iguales · Tasa anual:{" "}
          <span className="font-semibold">{annualInterestPct}%</span> · Gracia:{" "}
          <span className="font-semibold">{graceUsedDisplay}</span> días
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-white/80 mb-1">Fecha inicio</label>
          <input
            type="date"
            value={startISO}
            onChange={(e) => setStartISO(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div>
          <label className="block text-xs text-white/80 mb-1">Importe total (PV)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div>
          <label className="block text-xs text-white/80 mb-1">Meses (1–3)</label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:ring-2 focus:ring-emerald-400"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/80 mb-1">TASA MENSUAL</label>
          <div className="w-full h-10 px-3 rounded-md bg-zinc-800 text-white flex items-center border border-zinc-700">
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

      <div className="rounded border border-zinc-800 overflow-hidden">
        <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-800 text-white">Cronograma</div>

        <div className="hidden md:grid grid-cols-5 px-3 py-2 text-xs text-white/80">
          <span>Cheque</span>
          <span>Días totales</span>
          <span>Días gravados</span>
          <span>% período</span>
          <span>Fecha</span>
        </div>

        <div className="divide-y divide-zinc-800">
          {schedule.map((it) => (
            <div key={it.k} className="grid grid-cols-1 md:grid-cols-5 px-3 py-2 text-sm">
              <div className="font-medium text-white">{fmt.format(it.amount)}</div>
              <div className="text-white/90">{it.daysTotal}</div>
              <div className="text-white/90">{it.daysCharged}</div>
              <div className="text-white/90">{it.periodPct.toFixed(2)}%</div>
              <div className="text-white/90">{it.dateISO}</div>
            </div>
          ))}
          {schedule.length === 0 && (
            <div className="px-3 py-3 text-sm text-zinc-400">
              Configure los datos para ver el plan.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="px-3 py-2 rounded border border-zinc-700 text-white hover:bg-zinc-800"
          onClick={() => {
            // Reset rápido al total inicial
            if (typeof initialTotal === "number") setTotal(String(round2(initialTotal)));
          }}
        >
          Restablecer PV
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => {
            if (!onProposeCheques) return;
            onProposeCheques({
              chequeValue,
              schedule: schedule.map(({ k, dateISO, amount }) => ({ k, dateISO, amount })),
              months,
              presentValue: PV,
              annualInterestPct,
              graceDays,
            });
          }}
          disabled={chequeValue <= 0 || schedule.length === 0}
          title={chequeValue > 0 ? "Insertar cheques con estos valores/fechas" : "Complete los datos"}
        >
          Usar este plan (agregar cheques)
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-center shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="text-white tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
