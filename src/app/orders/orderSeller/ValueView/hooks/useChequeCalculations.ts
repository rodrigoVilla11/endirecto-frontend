// hooks/useChequeCalculations.ts

import { useMemo } from "react";
import { chargeableDaysFor, dailyRateFromAnnual } from "../utils/chequeRules";
import { ChequeCalculationResult, ValueItem } from "../types/types";
import { toNum } from "../utils/currencyUtils";

export interface UseChequeCalculationsProps {
  /** Tasa anual (ej: 96) */
  annualInterestPct: number;
  /** Fecha del recibo (default: hoy) */
  receiptDate?: Date;
  /** Fecha de emisión estimada de la factura */
  invoiceIssueDateApprox?: Date;
  /** Bloquear cálculo de interés */
  blockChequeInterest?: boolean;
}

export function useChequeCalculations({
  annualInterestPct,
  receiptDate = new Date(),
  invoiceIssueDateApprox,
  blockChequeInterest = false,
}: UseChequeCalculationsProps) {
  // Tasa diaria calculada una sola vez
  const dailyRate = useMemo(
    () => dailyRateFromAnnual(annualInterestPct),
    [annualInterestPct]
  );

  /**
   * Calcula el interés de un cheque en pesos
   */
  const chequeInterest = (v: ValueItem): number => {
    if (v.method !== "cheque") return 0;
    if (blockChequeInterest) return 0;

    // Si viene de PlanCalculator con CF pre-calculado, usarlo
    if (typeof v.cf === "number" && Number.isFinite(v.cf)) {
      return +v.cf.toFixed(2);
    }

    const base = toNum(v.raw_amount ?? v.amount);
    if (!base) return 0;

    const days = chargeableDaysFor(v, receiptDate, invoiceIssueDateApprox);
    const pct = dailyRate * days;
    return +(base * pct).toFixed(2);
  };

  /**
   * Calcula el neto de un cheque (bruto - interés)
   */
  const computeChequeNeto = (
    raw: string,
    v: ValueItem
  ): ChequeCalculationResult => {
    const base = toNum(raw);

    if (blockChequeInterest) {
      return { neto: base, int$: 0 };
    }

    // Si tenemos CF pre-calculado
    if (typeof v.cf === "number" && Number.isFinite(v.cf)) {
      const int$ = +v.cf.toFixed(2);
      const neto = Math.max(0, +(base - int$).toFixed(2));
      return { neto, int$ };
    }

    // Lógica tradicional
    const days = chargeableDaysFor(v, receiptDate, invoiceIssueDateApprox);
    const int$ = +(base * (dailyRate * days)).toFixed(2);
    const neto = Math.max(0, +(base - int$).toFixed(2));
    return { neto, int$ };
  };

  /**
   * Calcula días gravables para un cheque
   */
  const getChargeableDays = (v: ValueItem): number => {
    return chargeableDaysFor(v, receiptDate, invoiceIssueDateApprox);
  };

  /**
   * Calcula el porcentaje de interés para un cheque
   */
  const getChequeInterestPct = (v: ValueItem): number => {
    if (v.method !== "cheque" || blockChequeInterest) return 0;
    const days = getChargeableDays(v);
    return dailyRate * days;
  };

  return {
    dailyRate,
    chequeInterest,
    computeChequeNeto,
    getChargeableDays,
    getChequeInterestPct,
  };
}