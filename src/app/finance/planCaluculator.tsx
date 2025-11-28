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
    return new Date(y, (m ?? 1) - 1, d ?? 1); // fecha local sin shift TZ
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

function inferInvoiceIssueDate(receipt: Date, minDays?: number) {
  if (typeof minDays !== "number" || !isFinite(minDays)) return undefined;
  return new Date(toYMD(new Date(receipt.getTime() - minDays * MS_PER_DAY)));
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

/* ===== Reglas iguales a ValueView ===== */

/** Días gravados según umbral 45d desde la emisión.
 * - Si `refinanciacion` => siempre días del cheque (al día = 0).
 * - Si sin emisión estimada => 0 (política conservadora).
 * - Si cheque <= emisión+45 => 0.
 * - Si recibo >= emisión+45 => días del cheque.
 * - Si el umbral cae entre recibo y cheque => desde umbral hasta cheque.
 */
function chargeableDaysFor({
  chequeDateISO,
  receiptDate,
  invoiceIssueDateApprox,
  refinanciacion,
}: {
  chequeDateISO?: string;
  receiptDate: Date;
  invoiceIssueDateApprox?: Date;
  refinanciacion?: boolean;
}) {
  if (!chequeDateISO) return 0;
  const cd = toYMD(chequeDateISO);
  const rd = toYMD(receiptDate);
  const daysCheque = clampNonNegInt((cd.getTime() - rd.getTime()) / MS_PER_DAY);

  // if (refinanciacion) return daysCheque;

  const issue = invoiceIssueDateApprox;
  if (!issue) return 0;

  const threshold45 = addDays(issue, 45);

  if (cd.getTime() <= threshold45.getTime()) return 0; // cobro en/antes del día 45

  if (rd.getTime() >= threshold45.getTime()) return daysCheque;

  return clampNonNegInt((cd.getTime() - threshold45.getTime()) / MS_PER_DAY);
}

const clampInt = (n?: number) =>
  typeof n === "number" && isFinite(n) ? Math.max(0, Math.round(n)) : undefined;

/** Promos igual que en ValueView:
 * A) 0–7 (incl) + cheque ≤30d desde emisión → 13%
 * B) 7–15 (incl) + cheque “al día” (±1) → 13%
 * C) 16–30 (incl) + cheque “al día” (±1) → 10%
 */
function getChequePromoRate({
  invoiceAgeAtReceiptDaysMin,
  invoiceIssueDateApprox,
  receiptDate,
  chequeDateISO,
}: {
  invoiceAgeAtReceiptDaysMin?: number;
  invoiceIssueDateApprox?: Date;
  receiptDate: Date;
  chequeDateISO?: string;
}) {
  if (!chequeDateISO) return 0;
  const cd = toYMD(chequeDateISO);
  const rd = toYMD(receiptDate);
  const age = clampInt(invoiceAgeAtReceiptDaysMin);

  const isSameDayLoose = Math.abs(cd.getTime() - rd.getTime()) <= MS_PER_DAY;

  if (typeof age === "number") {
    // A
    if (age >= 0 && age <= 7 && invoiceIssueDateApprox) {
      const daysFromIssueToCheque = Math.round(
        (cd.getTime() - invoiceIssueDateApprox.getTime()) / MS_PER_DAY
      );
      if (daysFromIssueToCheque <= 30) return 0.13;
    }
    // B
    if (age >= 7 && age <= 15 && isSameDayLoose) return 0.13;
    // C
    if (age >= 16 && age <= 30 && isSameDayLoose) return 0.1;
  }
  return 0;
}

/** Base nominal para promo: raw si existe (>0), si no, neto */
const promoBaseOf = (raw: number, net: number) => (raw > 0 ? raw : net);
// 1) Tipos auxiliares
type PlanChequeItem = {
  dateISO: string;
  daysTotal: number;
  daysCharged: number;
  periodPct: number;
  raw: number;
  net: number;
  promoRate: number;
  promoAmount: number;
};

type PlanResult = {
  cheques: PlanChequeItem[];
  invoiceIssueDateApprox?: Date;
  // NUEVO: RECARGO DOCS
  docSurchargeDays: number; // días > 45 (si hay)
  docSurchargeRate: number; // fracción (ej: 0.035 para 3.5%)
  docSurchargeAmount: number; // monto aplicado al PV
  targetNetWithDocSurcharge: number; // PV ajustado por recargo
};

/* ===== Plan con BRUTO igual y reglas de ValueView ===== */
/* ===== Plan con cheques iguales en BRUTO ===== */
function computeEqualRawChequesWithRules(params: {
  targetNet: number; // Monto a refinanciar (NETO)
  chequeDatesISO: string[];
  annualInterestPct: number;
  docsDaysMin?: number;
  receiptDate: Date;
  refinanciacion?: boolean;
  blockChequeInterest?: boolean;
}): PlanResult {
  const {
    targetNet,
    chequeDatesISO,
    annualInterestPct,
    docsDaysMin,
    receiptDate,
    refinanciacion,
    blockChequeInterest = false,
  } = params;

  const n = chequeDatesISO.length;
  const daily = dailyRateFromAnnual(annualInterestPct);
  const invoiceIssueDateApprox = inferInvoiceIssueDate(
    receiptDate,
    docsDaysMin
  );

  // === RECARGO POR DOCUMENTOS (lo dejamos igual, sólo informativo) ===
  const docSurchargeDays = Math.max(0, (docsDaysMin ?? 0) - 45);
  const docSurchargeRate = docSurchargeDays > 0 ? daily * docSurchargeDays : 0;
  const docSurchargeAmount =
    Math.round(targetNet * docSurchargeRate * 100) / 100;

  if (targetNet <= 0 || n === 0) {
    return {
      cheques: [],
      invoiceIssueDateApprox,
      docSurchargeDays,
      docSurchargeRate,
      docSurchargeAmount,
      targetNetWithDocSurcharge: targetNet,
    };
  }

  // === NUEVA LÓGICA: costo financiero total y cheques iguales ===
  // Tasa mensual (la misma que mostrás en "TASA MENSUAL")
  const monthlyRate = daily * 30; // fracción mensual, ej: 0.0452 = 4,52 %

  // Idea: el 1er cheque (a 30 días) no genera CF, los siguientes sí → (n - 1)
  const monthsCharged = Math.max(n - 1, 0);

  const totalInterest = +(targetNet * monthlyRate * monthsCharged).toFixed(2); // Costo financiero total
  const totalGross = +(targetNet + totalInterest).toFixed(2); // Total a pagar en cheques

  // Repartimos NETO y BRUTO en partes iguales (ajustando el último por redondeo)
  const baseNet = +(targetNet / n).toFixed(2);
  const baseGross = +(totalGross / n).toFixed(2);

  let accNet = 0;
  let accGross = 0;

  const cheques: PlanChequeItem[] = chequeDatesISO.map((iso, idx) => {
    const isLast = idx === n - 1;

    const net = isLast ? +(targetNet - accNet).toFixed(2) : baseNet;
    const raw = isLast ? +(totalGross - accGross).toFixed(2) : baseGross;

    accNet += net;
    accGross += raw;

    const daysTotal = diffFromTodayToDate(iso) || 0;

    // Para info de "días gravados" seguimos usando la misma regla
    const daysChargedRaw = chargeableDaysFor({
      chequeDateISO: iso,
      receiptDate,
      invoiceIssueDateApprox,
      refinanciacion,
    });
    const daysCharged = blockChequeInterest ? 0 : daysChargedRaw;

    // % del período (info nada más, no afecta el cálculo principal)
    const monthsFromStart = idx + 1;
    const periodPct =
      (blockChequeInterest ? 0 : monthlyRate * monthsFromStart) * 100;

    const promoRate = getChequePromoRate({
      invoiceAgeAtReceiptDaysMin: docsDaysMin,
      invoiceIssueDateApprox,
      receiptDate,
      chequeDateISO: iso,
    });

    const promoAmount = +(promoBaseOf(raw, net) * promoRate).toFixed(2);

    return {
      dateISO: iso,
      daysTotal,
      daysCharged,
      periodPct,
      raw, // BRUTO de cada cheque (todos iguales salvo centavos)
      net, // NETO imputable
      promoRate,
      promoAmount,
    };
  });

  return {
    cheques,
    invoiceIssueDateApprox,
    docSurchargeDays,
    docSurchargeRate,
    docSurchargeAmount,
    targetNetWithDocSurcharge: targetNet,
  };
}

/* ====== UI ====== */
export default function PlanCalculator({
  title = "Cálculo de pagos a plazo (30/60/90)",
  graceDays, // solo para display, la lógica real usa 45d desde emisión como en ValueView
  initialTotal,
  onProposeCheques,
  annualInterestPct,
  copy,
  newValues,
  setNewValues,
  /** Reglas extra para igualar a ValueView */
  docsDaysMin,
  receiptDate = new Date(),
  refinanciacion = true,
  blockChequeInterest = false,
}: // por defecto es plan de refinanciación
{
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
  copy?: boolean;
  newValues: ValueItem[];
  setNewValues: React.Dispatch<React.SetStateAction<ValueItem[]>>;
  docsDaysMin?: number;
  receiptDate?: Date;
  refinanciacion?: boolean;
  blockChequeInterest?: boolean;
}) {
  const [months, setMonths] = useState<number>(3);
  const [startISO, setStartISO] = useState<string>(() => toISO(new Date()));
  const [total, setTotal] = useState<string>("");
  // Prefill del total cuando viene del padre
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

  // Plan con las mismas reglas que ValueView
  // 3) En tu useMemo, tipá el resultado y destrucurá sin warnings
  const {
    cheques: schedule,
    invoiceIssueDateApprox,
    // NUEVO: RECARGO DOCS
    docSurchargeDays,
    docSurchargeRate,
    docSurchargeAmount,
    targetNetWithDocSurcharge,
  } = useMemo<PlanResult>(
    () =>
      computeEqualRawChequesWithRules({
        targetNet: PV,
        chequeDatesISO: chequeDates,
        annualInterestPct,
        docsDaysMin,
        receiptDate,
        refinanciacion,
        blockChequeInterest,
      }),
    [
      PV,
      chequeDates,
      annualInterestPct,
      docsDaysMin,
      receiptDate,
      refinanciacion,
      blockChequeInterest,
    ]
  );

  const totalNominal = schedule.reduce((sum: any, it: any) => sum + it.raw, 0);
  const totalNet = schedule.reduce((sum: any, it: any) => sum + it.net, 0);
  const promoTotal = schedule.reduce((s: any, x: any) => s + x.promoAmount, 0);

  // Inserta cheques en newValues respetando la regla de "Refinanciación" (trata días como daysCheque)
  const pushPlanToValues = () => {
    if (schedule.length === 0 || PV <= 0) return;

    setNewValues((prev) => {
      const next = [...prev];
      schedule.forEach((it: any, i: any) => {
        next.push({
          amount: it.net.toFixed(2), // NETO imputable
          raw_amount: it.raw.toFixed(2), // BRUTO para CF
          selectedReason: `Refinanciación saldo ${i + 1}/${schedule.length}`, // activa lógica de refinanciación en ValueView
          method: "cheque",
          bank: "",
          chequeDate: it.dateISO,
          chequeNumber: "",
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
          <span className="font-semibold">{annualInterestPct}%</span> · Umbral
          CF: <span className="font-semibold">45 días desde emisión</span>
          {typeof graceDays === "number" ? (
            <>
              {" "}
              · Gracia (display):{" "}
              <span className="font-semibold">{graceDays}</span> días
            </>
          ) : null}
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

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="CHEQUES" value={String(schedule.length)} highlight />
        <Metric label="BRUTO TOTAL" value={fmt.format(totalNominal)} />
        <Metric label="INTERÉS" value={fmt.format(totalNominal - totalNet)} />
        <Metric label="PROMO (INFO)" value={fmt.format(promoTotal)} />
      </div>

      {blockChequeInterest && (
        <div className="text-xs mt-1 px-2 py-1 rounded bg-emerald-600/15 border border-emerald-600/30 text-emerald-300 inline-block">
          Sin recargo de cheques (según pliego)
        </div>
      )}

      {/* NUEVO: mostrar recargo si corresponde */}
      {docSurchargeDays > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <div className="text-sm text-red-200">
            <strong>Recargo por documentos:</strong> {docSurchargeDays} días
            sobre 45 ⇒ {(docSurchargeRate * 100).toFixed(2)}%{" · "}
            Monto: <strong>{fmt.format(docSurchargeAmount)}</strong>
            {" · "}
            Objetivo ajustado:{" "}
            <strong>{fmt.format(PV + docSurchargeAmount)}</strong>
          </div>
        </div>
      )}

      {/* CRONOGRAMA */}
      <div className="rounded border border-zinc-800 overflow-hidden">
        <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-800 text-white bg-zinc-800/50">
          Cronograma de cheques
        </div>

        <div className="hidden md:grid grid-cols-7 px-3 py-2 text-xs text-white/60 bg-zinc-800/30">
          <span>#</span>
          <span>Fecha</span>
          <span>Días total</span>
          <span>Días gravados</span>
          <span className="text-right">Bruto</span>
          <span className="text-right">% período</span>
          <span className="text-right">Promo</span>
        </div>

        <div className="divide-y divide-zinc-800">
          {schedule.map((it: any, idx: any) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-7 px-3 py-2 text-sm hover:bg-zinc-800/30 transition-colors"
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
              <div className="text-right text-emerald-400">
                {it.promoRate > 0
                  ? `${(it.promoRate * 100).toFixed(2)}% · ${fmt.format(
                      it.promoAmount
                    )}`
                  : "—"}
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

      {/* Info emisión/umbral */}
      <div className="text-xs text-zinc-400">
        {invoiceIssueDateApprox ? (
          <>
            Emisión estimada:{" "}
            <span className="text-white/80">
              {invoiceIssueDateApprox.toLocaleDateString("es-AR")}
            </span>{" "}
            · Umbral 45d:{" "}
            <span className="text-white/80">
              {addDays(invoiceIssueDateApprox, 45).toLocaleDateString("es-AR")}
            </span>
          </>
        ) : (
          <>No se puede estimar emisión (falta `docsDaysMin`).</>
        )}
      </div>

      {/* AVISO DE DIFERENCIA */}
      {schedule.length > 0 && Math.abs(totalNet - PV) >= 0.01 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg">⚠️</span>
            <div className="text-sm text-amber-200">
              <strong>Atención:</strong> Diferencia de{" "}
              {fmt.format(Math.abs(totalNet - PV))}
              detectada (los netos se calculan solo con CF; las promos se
              aplican luego como en ValueView).
            </div>
          </div>
        </div>
      )}

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

        {/* Inserta plan directo en newValues */}
        <button
          type="button"
          className={`px-4 py-2 rounded font-medium transition-colors ${
            schedule.length > 0 && PV > 0
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
          }`}
          onClick={pushPlanToValues}
          disabled={schedule.length === 0 || PV <= 0}
          title={
            PV > 0
              ? "Insertar estos cheques en el pago"
              : "Complete el importe total"
          }
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
