// hooks/usePaymentTotals.ts

import { useMemo } from "react";
import { ValueItem, PaymentTotals } from "../types/types";
import { toNum } from "../utils/currencyUtils";
import { nominalOf, isRefinanciacion } from "../utils/chequeRules";
// hooks/usePaymentTotals.ts

export interface UsePaymentTotalsProps {
  values: ValueItem[];
  /** Función para calcular interés de un cheque */
  chequeInterest: (v: ValueItem) => number;
  /** Total de promo de cheques */
  totalChequePromo: number;
  /** Ajuste de documentos (+desc / -rec) */
  docAdjustmentSigned?: number;
  /** Neto a pagar (sin ajustes) */
  netToPay?: number;
  /** Gross (total bruto de documentos) */
  gross?: number;
  /** Hay cheques con promo */
  hasChequePromo?: boolean;
  /** Hay cheques en general */
  hasCheques?: boolean;
}

export function usePaymentTotals({
  values,
  chequeInterest,
  totalChequePromo,
  docAdjustmentSigned = 0,
  netToPay = 0,
  gross = 0,
  hasChequePromo = false,
  hasCheques = false,
}: UsePaymentTotalsProps): PaymentTotals {
  // Total de valores imputables (amount neto)
  const totalValues = useMemo(
    () => values.reduce((acc, v) => acc + toNum(v.amount), 0),
    [values]
  );

  // Total nominal (bruto para cheques, amount para otros)
  const totalNominalValues = useMemo(
    () => values.reduce((acc, v) => acc + nominalOf(v), 0),
    [values]
  );

  // Total de intereses de cheques
  const totalChequeInterest = useMemo(
    () =>
      values.reduce((acc, v) => {
        if (v.method !== "cheque") return acc;
        return acc + chequeInterest(v);
      }, 0),
    [values, chequeInterest]
  );

  // Detectar si hay descuento
  const hasDiscount = docAdjustmentSigned > 0;

  // Detectar refinanciación exacta
  const hasExactRefi = useMemo(
    () =>
      values.some(
        (v) =>
          (v.selectedReason || "").toLowerCase().trim() === "refinanciación"
      ),
    [values]
  );

  // Detectar cheques + descuento
  const hasChequeAndDiscount = hasCheques && hasDiscount;

  // Detectar si tiene concepto de refinanciación
  const hasRefiConcept = hasExactRefi && hasDiscount;

  // Pago efectivo neto (nominal - CF + promo)
  const netEffectivePayment = useMemo(() => {
    return +(
      totalNominalValues -
      totalChequeInterest +
      totalChequePromo
    ).toFixed(2);
  }, [totalNominalValues, totalChequeInterest, totalChequePromo]);

  // Total combinado de ajustes (docs + CF - promo)
  const totalDescCostF = useMemo(() => {
    const docAdj = -docAdjustmentSigned; // invertir signo para UI
    return +(docAdj + totalChequeInterest - totalChequePromo).toFixed(2);
  }, [docAdjustmentSigned, totalChequeInterest, totalChequePromo]);

  // Variable auxiliar: indica si el pago alcanza el neto
  const reachesNetToPay = useMemo(() => {
    const EPS = 1;
    return Math.abs(totalNominalValues - netToPay) <= EPS;
  }, [totalNominalValues, netToPay]);

  // Saldo UI: lógica corregida para todos los casos
  const saldoUI = useMemo(() => {
    // CASO 1: Refinanciación explícita
    // Base = gross, Pago = neto efectivo (con CF y promo)
    if (hasExactRefi) {
      return +(gross - netEffectivePayment).toFixed(2);
    }

    // CASO 2: Cheques + Descuento + Pago completo
    // Aplica promo, base = gross
    if (hasChequeAndDiscount && reachesNetToPay) {
      return +(gross - netEffectivePayment).toFixed(2);
    }

    // CASO 3: Solo cheques (sin descuento o pago parcial)
    // NO aplica promo, base = gross, pago sin promo
    if (hasCheques) {
      const netWithoutPromo = totalNominalValues - totalChequeInterest;
      return +(gross - netWithoutPromo).toFixed(2);
    }

    // CASO 4: Pagos en efectivo/transferencia
    // Si el pago completa el netToPay -> Saldo = 0
    // Si es parcial -> Saldo = netToPay - pago
    if (reachesNetToPay) {
      return 0; // Pago completo
    }
    
    return +(netToPay - totalNominalValues).toFixed(2);
  }, [
    hasExactRefi,
    hasChequeAndDiscount,
    hasCheques,
    reachesNetToPay,
    gross,
    netToPay,
    netEffectivePayment,
    totalNominalValues,
    totalChequeInterest,
    docAdjustmentSigned,
  ]);

  return {
    totalNominalValues,
    totalValues,
    totalChequeInterest,
    totalChequePromo,
    netEffectivePayment,
    totalDescCostF,
    saldoUI,
  };
}