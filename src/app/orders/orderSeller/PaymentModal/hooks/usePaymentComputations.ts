// hooks/usePaymentComputations.ts
"use client";

import { useMemo } from "react";
import { diffFromDateToToday } from "@/lib/dateUtils";
import { ValueItem } from "../../ValueView/types/types";

type PaymentType = "pago_anticipado" | "cta_cte";

type PaymentDoc = {
  document_id: string;
  number: string;
  date: string;
  expiration_date: string;
  amount: string;
  document_balance: string;
  payment_condition: string;
  saldo_a_pagar: string;
  days_until_expiration: number;
  days_until_expiration_today: number;
};

type Args = {
  newPayment: PaymentDoc[];
  newValues: ValueItem[];
  paymentTypeUI: PaymentType;
  graceDiscount: Record<string, boolean>;
  annualInterestPct: number;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function isNoDiscountCondition(txt?: string) {
  const v = (txt || "").toLowerCase().trim();
  return (
    v === "segun pliego" ||
    v === "cuenta corriente" ||
    v === "no especificado" ||
    v === "not specified"
  );
}

function isPromo1310(txt?: string) {
  const v = (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    v.includes("promo") &&
    /15\s*dias/.test(v) &&
    /13(\s*%|.*dto)/.test(v) &&
    /30\s*d/.test(v) &&
    /10(\s*%|)/.test(v)
  );
}

function getDocDays(doc: {
  days_until_expiration_today?: any;
  date?: string;
}) {
  const v = Number(doc.days_until_expiration_today);
  if (Number.isFinite(v)) return v;
  return diffFromDateToToday(doc.date);
}

function getAdjustmentRate(
  days: number,
  type: PaymentType,
  docPaymentCondition: string | undefined,
  forceTenPct: boolean = false,
  annualInterestPct: number
): { rate: number; note?: string } {
  const annualInterest = annualInterestPct / 100;

  if (isNoDiscountCondition(docPaymentCondition)) {
    return { rate: 0, note: "Sin descuento por condición de pago" };
  }
  if (type === "pago_anticipado") {
    return { rate: 0, note: "Pago anticipado sin regla" };
  }
  if (forceTenPct) {
    return { rate: +0.1, note: "Descuento 10% (30–37 días activado)" };
  }
  if (isNaN(days))
    return { rate: 0, note: "Fecha/estimación de días inválida" };

  const promo = isPromo1310(docPaymentCondition);

  if (days <= 7)
    return {
      rate: promo ? +0.15 : +0.2,
      note: promo ? "Descuento 15% (promo)" : "Descuento 20%",
    };
  if (days <= 15) return { rate: +0.13, note: "Descuento 13%" };
  if (days <= 30) return { rate: +0.1, note: "Descuento 10%" };
  if (days <= 45) return { rate: 0, note: "Sin ajuste (0%)" };

  const daysOver = days - 45;
  const daily = annualInterest / 365;
  const surchargeRate = +(daily * daysOver);
  return { rate: -surchargeRate, note: `Recargo por ${daysOver} días` };
}

function computeAdjustmentOnValuesFull(values: ValueItem[], docs: any[]) {
  const valuesTotal = values.reduce(
    (a, v) => a + parseFloat(v.amount || "0"),
    0
  );
  if (valuesTotal <= 0 || docs.length === 0) return 0;

  const docAdjustment = docs.reduce(
    (acc: number, d: any) => acc + (d.base || 0) * (d.rate || 0),
    0
  );

  const docsBaseTotal = docs.reduce(
    (acc: number, d: any) => acc + (d.base || 0),
    0
  );
  if (docsBaseTotal <= 0) return 0;

  const globalRateOnBase = docAdjustment / docsBaseTotal; // >0 desc, <0 rec

  const sumNonCheque = values.reduce(
    (a, v) => a + (v.method !== "cheque" ? parseFloat(v.amount || "0") : 0),
    0
  );

  const baseForAdj = globalRateOnBase > 0 ? sumNonCheque : valuesTotal;

  const adjOnValues = baseForAdj * globalRateOnBase * -1;

  return Math.round((adjOnValues + Number.EPSILON) * 100) / 100;
}

function capAdjustmentOnValues(adjOnValues: number, docAdjSigned: number) {
  const docAdjInValuesSign = -docAdjSigned;

  const limit = Math.abs(docAdjInValuesSign);
  const sign = Math.sign(adjOnValues) || 0;

  const capped = Math.min(Math.abs(adjOnValues), limit) * sign;
  return Math.round((capped + Number.EPSILON) * 100) / 100;
}

export function usePaymentComputations({
  newPayment,
  newValues,
  paymentTypeUI,
  graceDiscount,
  annualInterestPct,
}: Args) {
  // 1) Descuentos por documento
  const computedDiscounts = useMemo(() => {
    return newPayment.map((doc) => {
      const days = getDocDays(doc);
      const noDiscountBlocked = isNoDiscountCondition(doc.payment_condition);

      const eligibleManual10 =
        paymentTypeUI === "cta_cte" &&
        !noDiscountBlocked &&
        Number.isFinite(days) &&
        (days as number) > 30 &&
        (days as number) <= 37;

      const forceTen = !!graceDiscount[doc.document_id] && eligibleManual10;

      const { rate, note } = getAdjustmentRate(
        days,
        paymentTypeUI,
        doc.payment_condition,
        forceTen,
        annualInterestPct
      );

      const base = parseFloat(doc.saldo_a_pagar || "0") || 0;
      const signedAdjustment = +(base * rate).toFixed(2);
      const finalAmount = +(base - signedAdjustment).toFixed(2);

      return {
        document_id: doc.document_id,
        number: doc.number,
        days,
        base,
        rate,
        signedAdjustment,
        finalAmount,
        note,
        noDiscountBlocked,
        eligibleManual10,
        manualTenApplied: forceTen,
      };
    });
  }, [newPayment, paymentTypeUI, graceDiscount, annualInterestPct]);

  // 2) Totales de documentos
  const totalBase = useMemo(
    () => computedDiscounts.reduce((a, d) => a + d.base, 0),
    [computedDiscounts]
  );

  const totalDocsFinal = useMemo(
    () => computedDiscounts.reduce((acc, d) => acc + d.finalAmount, 0),
    [computedDiscounts]
  );

  const docAdjustmentSigned = useMemo(
    () => round2(totalBase - totalDocsFinal),
    [totalBase, totalDocsFinal]
  );

  // 3) Valores / pagos
  const totalValues = useMemo(
    () =>
      newValues.reduce(
        (total, v) => total + parseFloat(v.amount || "0"),
        0
      ),
    [newValues]
  );

  const valuesNetNonChequeUI = useMemo(
    () =>
      newValues.reduce(
        (acc, v) =>
          acc + (v.method !== "cheque" ? parseFloat(v.amount || "0") || 0 : 0),
        0
      ),
    [newValues]
  );

  // 4) Bloqueo de interés por condición de pago
  const blockChequeInterest = useMemo(
    () => computedDiscounts.some((d) => d.noDiscountBlocked),
    [computedDiscounts]
  );

  // 5) Ajuste sobre valores
  const rawAdjustmentOnValues = useMemo(
    () => computeAdjustmentOnValuesFull(newValues, computedDiscounts),
    [newValues, computedDiscounts]
  );

  const totalAdjustmentSigned = useMemo(
    () => capAdjustmentOnValues(rawAdjustmentOnValues, docAdjustmentSigned),
    [rawAdjustmentOnValues, docAdjustmentSigned]
  );

  // 6) Recargo pendiente (solo recargo)
  const docSurchargePending = useMemo(() => {
    const gross = totalBase;
    const docAdjTotal = docAdjustmentSigned;
    if (!(gross > 0) || !(docAdjTotal < 0)) return 0;

    const rateAbs = Math.abs(docAdjTotal) / gross;

    const appliedSoFar =
      Math.round(valuesNetNonChequeUI * rateAbs * 100) / 100;

    const pending = Math.max(0, Math.abs(docAdjTotal) - appliedSoFar);
    return Math.round(pending * 100) / 100;
  }, [totalBase, docAdjustmentSigned, valuesNetNonChequeUI]);

  // 7) Modo parcial / total
  const hasPartialPayment = useMemo(
    () =>
      totalValues > 0 &&
      Math.abs(totalValues - round2(totalDocsFinal)) > 0.01,
    [totalValues, totalDocsFinal]
  );

  const totalNetForUI = useMemo(
    () => round2(totalDocsFinal),
    [totalDocsFinal]
  );

  // 8) Días de documentos (para refi / promo etc.)
  const docsDaysMin = useMemo(() => {
    if (!Array.isArray(computedDiscounts) || computedDiscounts.length === 0)
      return undefined;

    const daysArray = computedDiscounts
      .map((d) => (typeof d?.days === "number" ? d.days : undefined))
      .filter(
        (n): n is number =>
          typeof n === "number" && Number.isFinite(n) && n >= 0
      );

    return daysArray.length > 0 ? Math.max(...daysArray) : undefined;
  }, [computedDiscounts]);

  const hasAnyUnder45Days = useMemo(
    () =>
      computedDiscounts.some(
        (d) => typeof d.days === "number" && d.days < 45
      ),
    [computedDiscounts]
  );

  const hasInvoiceToday = useMemo(
    () =>
      computedDiscounts.some(
        (d) => typeof d.days === "number" && Math.round(d.days) === 0
      ),
    [computedDiscounts]
  );

  return {
    computedDiscounts,
    totalBase,
    totalDocsFinal,
    docAdjustmentSigned,
    totalValues,
    valuesNetNonChequeUI,
    blockChequeInterest,
    rawAdjustmentOnValues,
    totalAdjustmentSigned,
    docSurchargePending,
    hasPartialPayment,
    totalNetForUI,
    docsDaysMin,
    hasAnyUnder45Days,
    hasInvoiceToday,
  };
}
