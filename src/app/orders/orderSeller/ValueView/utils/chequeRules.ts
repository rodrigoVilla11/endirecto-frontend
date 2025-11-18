import { ValueItem } from "../types/types";
import {
  toYMD,
  clampNonNegInt,
  addDays,
  daysBetween,
  isSameDayLoose,
  clampInt,
  MS_PER_DAY,
} from "./dateUtils";

/**
 * Normaliza tasa anual: si viene como fracción diaria la convierte a %
 */
export function normalizeAnnualPct(x: number): number {
  if (x > 0 && x < 1) return x * 365 * 100;
  return x;
}

/**
 * Calcula tasa diaria desde tasa anual
 */
export function dailyRateFromAnnual(annualInterestPct: number): number {
  const annualPct = normalizeAnnualPct(annualInterestPct);
  return annualPct / 100 / 365;
}

/**
 * Verifica si un pago es de tipo "Refinanciación"
 */
export function isRefinanciacion(v: ValueItem): boolean {
  return (
    (v.selectedReason || "").trim().toLowerCase() === "refinanciación"
  );
}

/**
 * Obtiene los días de gracia para un cheque
 */
export function graceFor(
  v: ValueItem,
  defaultGraceDays: number = 45
): number {
  if (isRefinanciacion(v)) {
    return v.overrideGraceDays ?? defaultGraceDays;
  }
  return defaultGraceDays;
}

/**
 * Calcula días gravables para costo financiero de cheque
 * 
 * Reglas:
 * - Refinanciación: siempre cobra todos los días del cheque
 * - Sin emisión conocida: cobra todos los días del cheque
 * - Si cobro <= día 45 desde emisión: 0 días
 * - Si ya pasó umbral al momento del recibo: cobra días del cheque
 * - Si umbral cae entre recibo y cheque: cobra desde umbral hasta cheque
 */
export function chargeableDaysFor(
  v: ValueItem,
  receiptDate: Date,
  invoiceIssueDateApprox?: Date
): number {
  if (v.method !== "cheque" || !v.chequeDate) return 0;

  const cd = toYMD(v.chequeDate); // fecha cobro
  const rd = toYMD(receiptDate); // fecha recibo
  const daysCheque = clampNonNegInt((cd.getTime() - rd.getTime()) / MS_PER_DAY);

  // Refinanciación: siempre cobrar los días del cheque
  if (isRefinanciacion(v)) return daysCheque;

  // Sin fecha de emisión: política conservadora (cobrar todo)
  if (!invoiceIssueDateApprox) return daysCheque;

  const threshold45 = addDays(invoiceIssueDateApprox, 45);

  // 1) Si el cobro es en/antes del día 45 desde emisión → 0
  if (cd.getTime() <= threshold45.getTime()) return 0;

  // 2) Si ya pasamos el umbral al momento del recibo → cobrar SOLO días del cheque
  if (rd.getTime() >= threshold45.getTime()) return daysCheque;

  // 3) El umbral cae entre recibo y cheque → cobrar desde el umbral hasta el cheque
  return clampNonNegInt((cd.getTime() - threshold45.getTime()) / MS_PER_DAY);
}

/**
 * Calcula la tasa promocional para un cheque según reglas de días
 * 
 * Reglas:
 * A) 0–7 días la factura Y cheque ≤30 días desde emisión → 13%
 * B) 7–15 días la factura Y cheque al día (mismo día recibo) → 13%
 * C) 15–30 días la factura Y cheque al día → 10%
 */
export function getChequePromoRate({
  invoiceAgeAtReceiptDaysMin,
  invoiceIssueDateApprox,
  receiptDate,
  chequeDateISO,
  blockChequeInterest = false,
}: {
  invoiceAgeAtReceiptDaysMin?: number;
  invoiceIssueDateApprox?: Date;
  receiptDate: Date;
  chequeDateISO?: string;
  blockChequeInterest?: boolean;
}): number {
  if (!chequeDateISO || blockChequeInterest) return 0;

  const cd = toYMD(chequeDateISO);
  const rd = toYMD(receiptDate);
  const age = clampInt(invoiceAgeAtReceiptDaysMin);

  const isSameDayLooseCheck = isSameDayLoose(cd, rd);

  if (typeof age === "number") {
    // A) 0–7 INCLUSIVE + cheque ≤30 días desde emisión → 13%
    if (age >= 0 && age <= 7 && invoiceIssueDateApprox) {
      const daysFromIssueToCheque = Math.round(
        (cd.getTime() - invoiceIssueDateApprox.getTime()) / MS_PER_DAY
      );
      if (daysFromIssueToCheque <= 30) return 0.13;
    }

    // B) 7–15 INCLUSIVE + cheque "al día" (±1 día) → 13%
    if (age >= 7 && age <= 15 && isSameDayLooseCheck) return 0.13;

    // C) 16–30 INCLUSIVE + cheque "al día" (±1 día) → 10%
    if (age >= 16 && age <= 30 && isSameDayLooseCheck) return 0.1;
  }

  return 0;
}

/**
 * Obtiene el monto base para calcular la promoción
 * (raw_amount si existe, sino amount)
 */
export function promoBaseOf(v: ValueItem): number {
  const raw = Number((v.raw_amount ?? "").replace(",", ".")) || 0;
  if (raw > 0) return raw;
  return Number((v.amount ?? "").replace(",", ".")) || 0;
}

/**
 * Obtiene el monto nominal de un ítem
 * (para cheques: raw_amount si existe, sino amount)
 */
export function nominalOf(v: ValueItem): number {
  if (v.method === "cheque") {
    const raw = (v.raw_amount ?? "").trim();
    return raw !== "" 
      ? Number(raw.replace(",", ".")) || 0
      : Number((v.amount ?? "").replace(",", ".")) || 0;
  }
  return Number((v.amount ?? "").replace(",", ".")) || 0;
}