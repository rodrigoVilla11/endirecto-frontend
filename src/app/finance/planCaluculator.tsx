"use client";

import React, { useEffect, useMemo, useState } from "react";
import { diffFromTodayToDate } from "@/lib/dateUtils";
import { ValueItem } from "../orders/orderSeller/ValueView";

/* ===== Helpers fecha ===== */
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (dOrStr: string | Date): Date => {
  if (typeof dOrStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dOrStr)) {
    const [y, m, d] = dOrStr.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }
  const d = new Date(dOrStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function addDaysLocalISO(dateISO: string, days: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const d0 = new Date(y, (m ?? 1) - 1, d ?? 1);
  const d1 = new Date(d0);
  d1.setDate(d0.getDate() + days);
  return toISO(d1);
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};
const clampNonNegInt = (x: number) =>
  Math.max(0, Math.round(Number.isFinite(x) ? x : 0));

/* ===== Matemática ===== */
const dailyRateFromAnnual = (annualInterestPct: number) => {
  const normalized =
    typeof annualInterestPct === "number" && isFinite(annualInterestPct)
      ? annualInterestPct
      : 96;
  return normalized / 100 / 365; // fracción diaria
};

/* ===== Días gravados: simplificado para refinanciación ===== */
function chargeableDaysFor({
  chequeDateISO,
  receiptDate,
  refinanciacion,
}: {
  chequeDateISO?: string;
  receiptDate: Date;
  refinanciacion?: boolean;
}) {
  if (!chequeDateISO) return 0;
  const cd = toYMD(chequeDateISO);
  const rd = toYMD(receiptDate);
  const daysCheque = clampNonNegInt((cd.getTime() - rd.getTime()) / MS_PER_DAY);
  if (refinanciacion) return daysCheque;
  return daysCheque;
}

/* ===== Tipos ===== */
type PlanChequeItem = {
  dateISO: string;
  daysTotal: number;
  daysCharged: number;
  periodPct: number;
  raw: number;
  net: number;
};

type PlanResult = {
  cheques: PlanChequeItem[];
};

/* ===== Cálculo compuesto (idéntico al Excel) ===== */
function computeEqualRawChequesExcelStyle(params: {
  targetNet: number;
  chequeDatesISO: string[];
  annualInterestPct: number;
  receiptDate: Date;
  refinanciacion?: boolean;
  blockChequeInterest?: boolean;
}): PlanResult {
  const {
    targetNet,
    chequeDatesISO,
    annualInterestPct,
    receiptDate,
    refinanciacion,
    blockChequeInterest = false,
  } = params;

  const daily = dailyRateFromAnnual(annualInterestPct);
  const iMonth = daily * 30;

  // Factores compuestos
  const compoundFactors = chequeDatesISO.map((_, idx) => {
    const k = idx + 1;
    return 1 / Math.pow(1 + iMonth, k);
  });

  const effectiveFactors = blockChequeInterest
    ? compoundFactors.map(() => 1)
    : compoundFactors;

  const sumFactors = effectiveFactors.reduce((a, b) => a + b, 0);
  const raw = +(targetNet / (sumFactors || 1)).toFixed(2);

  const cheques: PlanChequeItem[] = chequeDatesISO.map((iso, idx) => {
    const cd = toYMD(iso);
    const rd = toYMD(receiptDate);
    const daysTotal = clampNonNegInt(
      (cd.getTime() - rd.getTime()) / MS_PER_DAY
    );
    const daysCharged = chargeableDaysFor({
      chequeDateISO: iso,
      receiptDate,
      refinanciacion,
    });
    const k = idx + 1;
    const periodPct = blockChequeInterest ? 0 : iMonth * 100 * k;
    const net = Math.max(0, +(raw * effectiveFactors[idx]).toFixed(2));

    return { dateISO: iso, daysTotal, daysCharged, periodPct, raw, net };
  });

  return { cheques };
}

/* ===== Componente principal ===== */
export default function PlanCalculator({
  title = "Cálculo de pagos a plazo (30/60/90)",
  initialTotal,
  onProposeCheques,
  annualInterestPct,
  newValues,
  setNewValues,
  receiptDate = new Date(),
  refinanciacion = true,
  blockChequeInterest = false,
}: {
  title?: string;
  initialTotal?: number;
  annualInterestPct: number;
  onProposeCheques?: (plan: any) => void;
  newValues: ValueItem[];
  setNewValues: React.Dispatch<React.SetStateAction<ValueItem[]>>;
  receiptDate?: Date;
  refinanciacion?: boolean;
  blockChequeInterest?: boolean;
}) {
  const [months, setMonths] = useState<number>(3);
  const [startISO, setStartISO] = useState<string>(() => toISO(new Date()));
  const [total, setTotal] = useState<string>("");

  useEffect(() => {
    if (
      typeof initialTotal === "number" &&
      isFinite(initialTotal) &&
      initialTotal > 0
    ) {
      setTotal(initialTotal.toFixed(2));
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
    () =>
      Array.from({ length: months }, (_, i) =>
        addDaysLocalISO(startISO, 30 * (i + 1))
      ),
    [startISO, months]
  );

  const { cheques: schedule } = useMemo<PlanResult>(
    () =>
      computeEqualRawChequesExcelStyle({
        targetNet: PV,
        chequeDatesISO: chequeDates,
        annualInterestPct,
        receiptDate,
        refinanciacion,
        blockChequeInterest,
      }),
    [
      PV,
      chequeDates,
      annualInterestPct,
      receiptDate,
      refinanciacion,
      blockChequeInterest,
    ]
  );

  const totalNominal = schedule.reduce((sum, it) => sum + it.raw, 0);
  const totalNet = schedule.reduce((sum, it) => sum + it.net, 0);
  const interes = totalNominal - PV;

  const pushPlanToValues = () => {
    if (schedule.length === 0 || PV <= 0) return;

    setNewValues((prev) => {
      const next = [...prev];

      schedule.forEach((it, i) => {
        const raw = +it.raw.toFixed(2); // bruto
        const net = +it.net.toFixed(2); // neto
        const cf = +(raw - net).toFixed(2); // 👈 costo financiero de ese cheque

        next.push({
          amount: net.toFixed(2), // neto imputable
          raw_amount: raw.toFixed(2), // bruto
          selectedReason: `Refinanciación saldo ${i + 1}/${schedule.length}`,
          method: "cheque",
          bank: "",
          chequeDate: it.dateISO,
          chequeNumber: "",
          cf, // 👈 acá se lo pasamos al ValueItem
        });
      });

      return next;
    });
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 sm:pr-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-semibold">{title}</h4>
        <div className="text-xs text-white/80">
          Máx. 6 meses · cuotas iguales · Tasa anual:{" "}
          <span className="font-semibold">{annualInterestPct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-white/80 mb-1">
            Fecha inicio
          </label>
          <input
            type="date"
            value={startISO}
            onChange={(e) => setStartISO(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div>
          <label className="block text-xs text-white/80 mb-1">
            Importe total (ya con recargos)
          </label>
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
          <label className="block text-xs text-white/80 mb-1">
            Meses (1–6)
          </label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:ring-2 focus:ring-emerald-400"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/80 mb-1">
            TASA MENSUAL
          </label>
          <div className="w-full h-10 px-3 rounded-md bg-zinc-800 text-white flex items-center border border-zinc-700">
            {(dailyRateFromAnnual(annualInterestPct) * 30 * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="CHEQUES" value={String(schedule.length)} highlight />
        <Metric label="BRUTO TOTAL" value={fmt.format(totalNominal)} />
        <Metric label="INTERÉS" value={fmt.format(interes)} />
        <Metric label="TOTAL A PAGAR" value={fmt.format(totalNominal)} />
      </div>

      {/* CRONOGRAMA */}
      <div className="rounded border border-zinc-800 overflow-hidden">
        <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-800 text-white bg-zinc-800/50">
          Cronograma de cheques
        </div>

        <div className="hidden md:grid grid-cols-6 px-3 py-2 text-xs text-white/60 bg-zinc-800/30">
          <span>#</span>
          <span>Fecha</span>
          <span>Días total</span>
          <span>Días gravados</span>
          <span className="text-right">Bruto</span>
          <span className="text-right">% período</span>
        </div>

        <div className="divide-y divide-zinc-800">
          {schedule.map((it, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-6 px-3 py-2 text-sm hover:bg-zinc-800/30 transition-colors"
            >
              <div className="font-medium text-white">#{idx + 1}</div>
              <div className="text-white/90">{it.dateISO}</div>
              <div className="text-white/90">{it.daysTotal}</div>
              <div className="text-white/90">
                {it.daysCharged}{" "}
                <span className="text-xs text-white/60">
                  ({it.periodPct.toFixed(2)}%)
                </span>
              </div>
              <div className="text-right text-white/90">
                {fmt.format(it.raw)}
              </div>
              <div className="text-right text-white/90">
                {it.periodPct.toFixed(2)}%
              </div>
            </div>
          ))}
          {schedule.length === 0 && (
            <div className="px-3 py-3 text-sm text-zinc-400 text-center">
              Configure los datos para ver el plan.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="px-3 py-2 rounded border border-zinc-700 text-white hover:bg-zinc-800 transition-colors"
          onClick={() => {
            if (typeof initialTotal === "number" && initialTotal > 0) {
              setTotal(initialTotal.toFixed(2));
            } else {
              setTotal("");
            }
          }}
        >
          Restablecer
        </button>

        <button
          type="button"
          className={`px-4 py-2 rounded font-medium transition-colors ${
            schedule.length > 0 && PV > 0
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
          }`}
          onClick={pushPlanToValues}
          disabled={schedule.length === 0 || PV <= 0}
        >
          Usar plan ({schedule.length} cheques)
        </button>
      </div>
    </div>
  );
}

/* === Componente visual de métrica === */
function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 text-center shadow-sm transition-colors ${
        highlight
          ? "border-emerald-500/50 bg-emerald-500/10"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wide text-zinc-400">
        {label}
      </div>
      <div
        className={`tabular-nums mt-0.5 font-semibold ${
          highlight ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
