// hooks/usePaymentTotals.ts

import { useMemo } from "react";
import { ValueItem, PaymentTotals } from "../types/types";
import { toNum } from "../utils/currencyUtils";
import { nominalOf } from "../utils/chequeRules";

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
  /** Total base (bruto SIN ajustes, antes de desc/rec) */
  totalBase?: number;
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
  totalBase = 0,
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

  // Detectar refinanciación exacta (cheques con concepto "Refinanciación")
  const hasExactRefi = useMemo(
    () =>
      values.some(
        (v) =>
          v.method === "cheque" &&
          (v.selectedReason || "").toLowerCase().trim() === "refinanciación"
      ),
    [values]
  );

  // Detectar refinanciación de saldo (cheques con concepto "Refinanciación saldo")
  const hasSaldoRefi = useMemo(
    () =>
      values.some(
        (v) =>
          v.method === "cheque" &&
          (v.selectedReason || "")
            .toLowerCase()
            .includes("refinanciación saldo")
      ),
    [values]
  );

  // Cualquier tipo de refinanciación
  const hasAnyRefi = hasExactRefi || hasSaldoRefi;

  // Detectar cheques + descuento
  const hasChequeAndDiscount = hasCheques && hasDiscount;

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
  // Saldo UI: lógica corregida para todos los casos
  const saldoUI = useMemo(() => {
    // CASO 1: Refinanciación completa (concepto "Refinanciación")
    if (hasExactRefi) {
      // Si hay DESCUENTO: usar totalBase (SIN descuento)
      if (docAdjustmentSigned > 0) {
        return +(totalBase - netEffectivePayment).toFixed(2);
      }

      // ✅ Si hay RECARGO: restar el recargo del saldo
      // porque el netEffectivePayment YA incluye el recargo al haber sido calculado
      if (docAdjustmentSigned < 0) {
        // Usar gross pero restar el recargo porque ya está en netEffectivePayment
        const saldoSinRecargo = gross - docAdjustmentSigned; // docAdj es negativo, así que suma = resta
        return +(saldoSinRecargo - netEffectivePayment).toFixed(2);
      }

      // Sin ajuste: usar gross
      return +(gross - netEffectivePayment).toFixed(2);
    }
    // CASO 2: Refinanciación de saldo (concepto "Refinanciación saldo x/y")
    if (hasSaldoRefi) {
      // ✅ AJUSTE: Cuando hay descuento, hay que RESTAR el descuento del saldo
      // porque el saldo mostrado incluye el descuento, pero al refinanciar se pierde
      if (docAdjustmentSigned > 0) {
        // Calcular el saldo sin descuento
        const saldoSinDescuento = netToPay - docAdjustmentSigned;
        return +(saldoSinDescuento - netEffectivePayment).toFixed(2);
      }

      // Con recargo o sin ajuste: usar netToPay normal
      return +(netToPay - netEffectivePayment).toFixed(2);
    }

    // CASO 3: Cheques + Descuento + Pago completo (sin refinanciación)
    // Aplica promo, base = gross
    if (hasChequeAndDiscount && reachesNetToPay) {
      return +(gross - netEffectivePayment).toFixed(2);
    }

    // CASO 4: Solo cheques (sin descuento o pago parcial)
    // NO aplica promo, base = gross, pago sin promo
    if (hasCheques) {
      const netWithoutPromo = totalNominalValues - totalChequeInterest;
      return +(gross - netWithoutPromo).toFixed(2);
    }

    // CASO 5: Pagos en efectivo/transferencia
    // Si el pago completa el netToPay -> Saldo = 0
    // Si es parcial -> Saldo = netToPay - pago
    if (reachesNetToPay) {
      return 0; // Pago completo
    }

    return +(netToPay - totalNominalValues).toFixed(2);
  }, [
    hasExactRefi,
    hasSaldoRefi,
    hasChequeAndDiscount,
    hasCheques,
    reachesNetToPay,
    gross,
    netToPay,
    totalBase,
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
    hasExactRefi,
    hasSaldoRefi,
    hasAnyRefi,
  };
}
