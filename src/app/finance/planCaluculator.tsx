"use client";

import React, { useEffect, useMemo, useState } from "react";
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
const dailyRateFromAnnual = (annualInterestPct: number) => {
  const normalized = typeof annualInterestPct === 'number' && isFinite(annualInterestPct) 
    ? annualInterestPct 
    : 96;
  return normalized / 100 / 365;
};

function getChequeDays(chequeISO?: string, graceDays?: number) {
  const daysTotal = diffFromTodayToDate(chequeISO) || 0;
  const g = Number.isFinite(graceDays as any) ? (graceDays as number) : 0;
  const daysCharged = Math.max(0, daysTotal - g);
  return { daysTotal, daysCharged, graceUsed: g };
}

// ✅ FUNCIÓN CORREGIDA: genera cheques cuyo NETO sume exacto el objetivo
function computeEqualNetCheques(params: {
  targetNet: number; // el monto NETO total que deben sumar los cheques
  chequeDatesISO: string[];
  annualInterestPct: number;
  graceDays?: number;
}) {
  const { targetNet, chequeDatesISO, annualInterestPct, graceDays } = params;
  if (targetNet <= 0 || chequeDatesISO.length === 0) return [];

  const n = chequeDatesISO.length;
  const daily = dailyRateFromAnnual(annualInterestPct);

  // ✅ Trabajar en CENTAVOS para evitar errores de redondeo
  const toCents = (num: number) => Math.round(num * 100);
  const fromCents = (cents: number) => cents / 100;

  const targetCents = toCents(targetNet);
  const cheques = [];
  let accumulatedCents = 0;


  for (let i = 0; i < n; i++) {
    const iso = chequeDatesISO[i];
    const { daysTotal, daysCharged } = getChequeDays(iso, graceDays);
    const interestPct = daily * daysCharged;
    const safeDen = 1 - interestPct <= 0 ? 1 : 1 - interestPct;

    let netCents: number;

    if (i === n - 1) {
      // ✅ ÚLTIMO CHEQUE: asignar el residuo EXACTO
      netCents = targetCents - accumulatedCents;
    } else {
      // Cheques intermedios: división entera en centavos
      netCents = Math.floor(targetCents / n);
    }

    const net = fromCents(netCents);
    const raw = net / safeDen; // bruto necesario para obtener ese neto
    
    accumulatedCents += netCents;

    cheques.push({
      dateISO: iso,
      daysTotal,
      daysCharged,
      net: parseFloat(net.toFixed(2)),
      raw: parseFloat(raw.toFixed(2)),
      periodPct: interestPct * 100,
    });
  }

  // ✅ Verificación final
  const sumNets = cheques.reduce((a, c) => a + c.net, 0);
  const diff = Math.abs(targetNet - sumNets);
  
  if (diff > 0.005) {
    console.error("❌ ERROR: Diferencia mayor a medio centavo");
  }

  return cheques;
}

/* ====== UI ====== */
export default function PlanCalculator({
  title = "Cálculo de pagos a plazo (30/60/90)",
  graceDays,
  initialTotal,
  onProposeCheques,
  annualInterestPct,
}: {
  title?: string;
  graceDays?: number;
  initialTotal?: number;
  annualInterestPct: number;
  onProposeCheques?: (plan: {
    schedule: Array<{ k: number; dateISO: string; amount: number }>;
    months: number;
    presentValue: number;
    annualInterestPct: number;
    graceDays?: number;
  }) => void;
}) {
  const [months, setMonths] = useState<number>(3);
  const [startISO, setStartISO] = useState<string>(() => toYMD(new Date()));
  const [total, setTotal] = useState<string>("");

  // ✅ Prefill del total cuando viene del padre
  useEffect(() => {
    if (typeof initialTotal === "number" && isFinite(initialTotal) && initialTotal > 0) {
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
        addDaysLocal(startISO, 30 * (i + 1))
      ),
    [startISO, months]
  );

  // ✅ Usar computeEqualNetCheques corregida
  const schedule = useMemo(
    () =>
      computeEqualNetCheques({
        targetNet: PV,
        chequeDatesISO: chequeDates,
        annualInterestPct,
        graceDays,
      }),
    [PV, chequeDates, annualInterestPct, graceDays]
  );

  const totalNominal = schedule.reduce((sum, it) => sum + it.raw, 0);
  const totalNet = schedule.reduce((sum, it) => sum + it.net, 0);
  const graceUsedDisplay = Number.isFinite(graceDays as any)
    ? (graceDays as number)
    : 0;

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
            Importe total (NETO)
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
            Meses (1–3)
          </label>
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
          <label className="block text-xs text-white/80 mb-1">
            TASA MENSUAL
          </label>
          <div className="w-full h-10 px-3 rounded-md bg-zinc-800 text-white flex items-center border border-zinc-700">
            {(dailyRateFromAnnual(annualInterestPct) * 30 * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* ✅ MÉTRICAS MEJORADAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric 
          label="CHEQUES" 
          value={String(schedule.length)}
          highlight
        />
        {/* <Metric 
          label="NETO TOTAL" 
          value={fmt.format(totalNet)}
          highlight={Math.abs(totalNet - PV) < 0.01}
        /> */}
        <Metric 
          label="BRUTO TOTAL" 
          value={fmt.format(totalNominal)} 
        />
        <Metric 
          label="INTERÉS" 
          value={fmt.format(totalNominal - totalNet)} 
        />
      </div>

      {/* ✅ CRONOGRAMA MEJORADO */}
      <div className="rounded border border-zinc-800 overflow-hidden">
        <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-800 text-white bg-zinc-800/50">
          Cronograma de cheques
        </div>

        <div className="hidden md:grid grid-cols-5 px-3 py-2 text-xs text-white/60 bg-zinc-800/30">
          <span>#</span>
          <span>Fecha</span>
          <span>Días total</span>
          <span>Días gravados</span>
          {/* <span className="text-right">Neto</span> */}
          <span className="text-right">Bruto</span>
        </div>

        <div className="divide-y divide-zinc-800">
          {schedule.map((it, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-5 px-3 py-2 text-sm hover:bg-zinc-800/30 transition-colors"
            >
              <div className="font-medium text-white">
                #{idx + 1}
              </div>
              <div className="text-white/90">{it.dateISO}</div>
              <div className="text-white/90">{it.daysTotal}</div>
              <div className="text-white/90">
                {it.daysCharged} <span className="text-xs text-white/60">({it.periodPct.toFixed(2)}%)</span>
              </div>
              {/* <div className="text-right text-emerald-400 font-semibold">
                {fmt.format(it.net)}
              </div> */}
              <div className="text-right text-white/90">
                {fmt.format(it.raw)}
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

      {/* ✅ VERIFICACIÓN DE DIFERENCIA */}
      {schedule.length > 0 && Math.abs(totalNet - PV) >= 0.01 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg">⚠️</span>
            <div className="text-sm text-amber-200">
              <strong>Atención:</strong> Diferencia de {fmt.format(Math.abs(totalNet - PV))} detectada.
              Verificá los cálculos.
            </div>
          </div>
        </div>
      )}

      {/* ✅ ACCIONES */}
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
          onClick={() => {
            if (!onProposeCheques || schedule.length === 0 || PV <= 0) return;
         
            
            onProposeCheques({
              schedule: schedule.map((it, idx) => ({
                k: idx + 1,
                dateISO: it.dateISO,
                amount: it.net, // ✅ neto imputable
              })),
              months,
              presentValue: PV,
              annualInterestPct,
              graceDays,
            });
          }}
          disabled={schedule.length === 0 || PV <= 0}
          title={
            PV > 0
              ? "Insertar estos cheques en el pago"
              : "Complete el importe total"
          }
        >
          Usar este plan ({schedule.length} cheques)
        </button>
      </div>
    </div>
  );
}

function Metric({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-md border p-3 text-center shadow-sm transition-colors ${
      highlight 
        ? "border-emerald-500/50 bg-emerald-500/10" 
        : "border-zinc-800 bg-zinc-900"
    }`}>
      <div className="text-[11px] uppercase tracking-wide text-zinc-400">
        {label}
      </div>
      <div className={`tabular-nums mt-0.5 font-semibold ${
        highlight ? "text-emerald-400" : "text-white"
      }`}>
        {value}
      </div>
    </div>
  );
}