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

  // 👇 NUEVO: Calcular descuento SOLO sobre pagos no-refi
  const effectiveDiscount = useMemo(() => {
    if (docAdjustmentSigned <= 0) return 0; // No hay descuento
    if (!hasSaldoRefi) return docAdjustmentSigned; // Sin refi, descuento completo

    // Con refinanciación de saldo: descuento SOLO sobre efectivo y cheques normales
    const nonRefiNominal = values
      .filter((v) => {
        if (v.method === "cheque") {
          const reason = (v.selectedReason || "").toLowerCase();
          return !reason.includes("refinanciación");
        }
        return true; // efectivo/transferencia
      })
      .reduce((acc, v) => acc + nominalOf(v), 0);

    // Descuento proporcional
    if (totalBase > 0) {
      const discountRate = docAdjustmentSigned / totalBase;
      return +(nonRefiNominal * discountRate).toFixed(2);
    }

    return 0;
  }, [docAdjustmentSigned, hasSaldoRefi, values, totalBase]);

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

  const totalDescCostF = useMemo(() => {
    const docAdj = -effectiveDiscount; // 👈 -(-$10.000) = +$10.000
    return +(docAdj + totalChequeInterest - totalChequePromo).toFixed(2);
  }, [effectiveDiscount, totalChequeInterest, totalChequePromo]);
  // Variable auxiliar: indica si el pago alcanza el neto
  const reachesNetToPay = useMemo(() => {
    const EPS = 1;
    return Math.abs(totalNominalValues - netToPay) <= EPS;
  }, [totalNominalValues, netToPay]);

  // Saldo UI: lógica corregida para todos los casos
  const saldoUI = useMemo(() => {
    console.log("🔍 CÁLCULO SALDO UI - Inputs:", {
      hasExactRefi,
      hasSaldoRefi,
      hasChequeAndDiscount,
      hasCheques,
      reachesNetToPay,
      docAdjustmentSigned,
      gross,
      netToPay,
      totalBase,
      netEffectivePayment,
      totalNominalValues,
      totalChequeInterest,
      totalChequePromo,
      effectiveDiscount,
    });

    // CASO 1: Refinanciación completa (concepto "Refinanciación")
    if (hasExactRefi) {
      console.log("📌 CASO 1: Refinanciación completa");

      if (docAdjustmentSigned > 0) {
        const result = +(totalBase - netEffectivePayment).toFixed(2);
        console.log("  ➜ Con DESCUENTO:", {
          totalBase,
          netEffectivePayment,
          saldo: result,
        });
        return result;
      }

      if (docAdjustmentSigned < 0) {
        const saldoSinRecargo = gross - docAdjustmentSigned;
        const result = +(saldoSinRecargo - netEffectivePayment).toFixed(2);
        console.log("  ➜ Con RECARGO:", {
          gross,
          docAdjustmentSigned,
          saldoSinRecargo,
          netEffectivePayment,
          saldo: result,
        });
        return result;
      }

      const result = +(gross - netEffectivePayment).toFixed(2);
      console.log("  ➜ Sin ajuste:", {
        gross,
        netEffectivePayment,
        saldo: result,
      });
      return result;
    }
    // CASO 2: Refinanciación de saldo (concepto "Refinanciación saldo x/y")
    if (hasSaldoRefi) {
      console.log("📌 CASO 2: Refinanciación de saldo");

      // Separar pagos: NO-refi vs refi
      const nonRefiValues = values.filter((v) => {
        if (v.method === "cheque") {
          const reason = (v.selectedReason || "").toLowerCase();
          return !reason.includes("refinanciación");
        }
        return true; // efectivo/transferencia
      });

      const refiCheques = values.filter((v) => {
        if (v.method !== "cheque") return false;
        const reason = (v.selectedReason || "").toLowerCase();
        return reason.includes("refinanciación saldo");
      });

      // Poder de pago de NO-refi (efectivo + cheques normales)
      const nonRefiEffective = nonRefiValues
        .filter((v) => v.method !== "cheque")
        .reduce((acc, v) => acc + nominalOf(v), 0);

      const nonRefiChequesNet = nonRefiValues
        .filter((v) => v.method === "cheque")
        .reduce((acc, v) => {
          const nom = nominalOf(v);
          const cf = chequeInterest(v);
          return acc + (nom - cf);
        }, 0);

      const nonRefiPower = nonRefiEffective + nonRefiChequesNet;

      // 👇 CAMBIO CLAVE: Para cheques de refi, usar el NETO (lo que realmente aportan)
      const refiPower = refiCheques.reduce((acc, v) => {
        const nom = nominalOf(v); // bruto
        const cf = chequeInterest(v); // costo financiero
        return acc + (nom - cf); // neto que aportan
      }, 0);

      if (docAdjustmentSigned > 0) {
        // Con descuento: comparar contra NETO (no contra saldo sin descuento)
        // porque los cheques de refi YA tienen su CF descontado
        const result = +(netToPay - nonRefiPower - refiPower).toFixed(2);
        console.log("  ➜ Con DESCUENTO:", {
          netToPay,
          docAdjustmentSigned,
          nonRefiPower,
          refiPower,
          totalPower: nonRefiPower + refiPower,
          efectivo: nonRefiEffective,
          chequesNormales: nonRefiChequesNet,
          saldo: result,
        });
        return result;
      }

      const result = +(netToPay - nonRefiPower - refiPower).toFixed(2);
      console.log("  ➜ Sin descuento/con recargo:", {
        netToPay,
        nonRefiPower,
        refiPower,
        totalPower: nonRefiPower + refiPower,
        saldo: result,
      });
      return result;
    }

    // CASO 3: Cheques + Descuento + Pago completo (sin refinanciación)
    if (hasChequeAndDiscount && reachesNetToPay) {
      console.log("📌 CASO 3: Cheques + Descuento + Pago completo");
      const result = +(gross - netEffectivePayment).toFixed(2);
      console.log("  ➜", {
        gross,
        netEffectivePayment,
        saldo: result,
      });
      return result;
    }

    // CASO 4: Solo cheques (sin descuento o pago parcial)
    if (hasCheques) {
      console.log("📌 CASO 4: Solo cheques");
      const netWithoutPromo = totalNominalValues - totalChequeInterest;
      const result = +(gross - netWithoutPromo).toFixed(2);
      console.log("  ➜", {
        gross,
        totalNominalValues,
        totalChequeInterest,
        netWithoutPromo,
        saldo: result,
      });
      return result;
    }

    // CASO 5: Pagos en efectivo/transferencia
    if (reachesNetToPay) {
      console.log("📌 CASO 5: Pago completo en efectivo");
      return 0;
    }

    console.log("📌 CASO 5: Pago parcial en efectivo");
    const result = +(netToPay - totalNominalValues).toFixed(2);
    console.log("  ➜", {
      netToPay,
      totalNominalValues,
      saldo: result,
    });
    return result;
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
