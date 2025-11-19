// PaymentModal/hooks/useCreatePaymentHandler.ts
"use client";

import { useState } from "react";
import { useCreatePaymentMutation } from "@/redux/services/paymentsApi";
import { useAddNotificationToCustomerMutation } from "@/redux/services/customersApi";
import { useAddNotificationToUserByIdMutation } from "@/redux/services/usersApi";
import { buildPaymentNotificationFromPayment } from "../../lib/buildPaymentNotificationFromPayment";
import { ValueItem } from "../../ValueView/types/types";

type PaymentType = "pago_anticipado" | "cta_cte";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const round4 = (n: number) =>
  Math.round((n + Number.EPSILON) * 10000) / 10000;

function normalizeAnnualPct(x: number) {
  if (x > 0 && x < 1) return x * 365 * 100;
  return x;
}

function daysBetweenToday(iso?: string) {
  if (!iso) return 0;
  const d = new Date(iso);
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

function computeChequeMeta(
  v: ValueItem,
  annualInterestPct: number,
  globalGraceValue?: number
) {
  const days_totals = daysBetweenToday(v.chequeDate);
  const days_total = days_totals + 1;

  const grace = Number.isFinite(v.overrideGraceDays as any)
    ? (v.overrideGraceDays as number)
    : globalGraceValue ?? 45;

  const annualNorm = normalizeAnnualPct(annualInterestPct);
  const daily = annualNorm / 100 / 365;
  const days_charged = Math.max(0, days_total - grace);
  const interest_pct = daily * days_charged;
  const raw = parseFloat(v.raw_amount || "0") || 0;
  const net_amount = parseFloat(v.amount || "0") || 0;
  const interest_amount = round2(raw - net_amount);

  return {
    raw,
    days_total,
    days_charged,
    daily,
    interest_pct,
    interest_amount,
    net_amount,
    grace_days_used: grace,
  };
}

// helpers fecha
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const toYMD = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

function inferInvoiceIssueDate(receiptDate: Date, minDaysAtReceipt?: number) {
  if (typeof minDaysAtReceipt !== "number" || !isFinite(minDaysAtReceipt))
    return undefined;
  const d = new Date(receiptDate.getTime() - minDaysAtReceipt * MS_PER_DAY);
  return toYMD(d);
}

// Regla de PROMO por cheque (0–7 / 7–15 / 16–30)
function getChequePromoRate({
  invoiceAgeAtReceiptDaysMin,
  invoiceIssueDateApprox,
  receiptDate,
  chequeDate,
}: {
  invoiceAgeAtReceiptDaysMin?: number;
  invoiceIssueDateApprox?: Date;
  receiptDate: Date;
  chequeDate?: string | null;
}) {
  if (!chequeDate) return 0;

  const cd = toYMD(new Date(chequeDate));
  const rd = toYMD(receiptDate);

  const age =
    typeof invoiceAgeAtReceiptDaysMin === "number"
      ? invoiceAgeAtReceiptDaysMin
      : undefined;

  const diffDays = Math.abs(cd.getTime() - rd.getTime()) / MS_PER_DAY;
  const isSameDayLoose = diffDays <= 1;

  if (typeof age === "number") {
    // A) 0–7 días factura + cheque ≤30 días desde emisión → 13%
    if (age >= 0 && age <= 7 && invoiceIssueDateApprox) {
      const daysFromIssueToCheque = Math.round(
        (cd.getTime() - invoiceIssueDateApprox.getTime()) / MS_PER_DAY
      );
      if (daysFromIssueToCheque <= 30) return 0.13;
    }

    // B) 7–15 días factura + cheque al día → 13%
    if (age > 7 && age <= 15 && isSameDayLoose) return 0.13;

    // C) 16–30 días factura + cheque al día → 10%
    if (age > 15 && age <= 30 && isSameDayLoose) return 0.1;
  }

  return 0;
}

type ComputedDiscount = {
  document_id: string;
  number: string;
  days: number;
  base: number;
  rate: number;
  signedAdjustment: number;
  finalAmount: number;
  note?: string;
  noDiscountBlocked?: boolean;
  manualTenApplied?: boolean;
};

type Args = {
  paymentTypeUI: PaymentType;
  selectedClientId?: string | null;
  customerName?: string;
  userId?: string | null;
  sellerId?: string | null;
  comments: string;
  newValues: ValueItem[];
  computedDiscounts: ComputedDiscount[];
  totalBase: number;
  totalNetForUI: number;
  totalValues: number;
  docAdjustmentSigned: number;
  checkGraceValue?: number;
  annualInterestPct: number;
  receiptDate: Date;
  blockChequeInterest: boolean;
  getPaymentConditionId: () => string;
  onSuccess?: () => void;
};

export function useCreatePaymentHandler({
  paymentTypeUI,
  selectedClientId,
  customerName,
  userId,
  sellerId,
  comments,
  newValues,
  computedDiscounts,
  totalBase,
  totalNetForUI,
  totalValues,
  docAdjustmentSigned,
  checkGraceValue,
  annualInterestPct,
  receiptDate,
  blockChequeInterest,
  getPaymentConditionId,
  onSuccess,
}: Args) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
  const [addNotificationToCustomer] = useAddNotificationToCustomerMutation();
  const [addNotificationToUserById] = useAddNotificationToUserByIdMutation();

  const handleCreatePayment = async () => {
    if (isCreating || isSubmitting) return;

    if (!userId) {
      alert("Falta user.id (logueo).");
      return;
    }
    if (!selectedClientId) {
      alert("Falta customer.id.");
      return;
    }
    if (newValues.length === 0) {
      alert("Agregá al menos un valor.");
      return;
    }

    setIsSubmitting(true);
    try {
      let valuesRawTotal = 0;
      let chequeInterestTotal = 0;

      // --- Valores ---
      const valuesPayload = newValues.map((v) => {
        const amountNet = round2(parseFloat(v.amount || "0"));
        const common = {
          amount: amountNet,
          concept: v.selectedReason,
          method: v.method,
          bank: v.bank || undefined,
          receipt_url: v.receiptUrl || undefined,
          receipt_original_name: v.receiptOriginalName || undefined,
        };

        if (v.method !== "cheque") {
          valuesRawTotal += amountNet;
          return common;
        }

        let m = computeChequeMeta(v, annualInterestPct, checkGraceValue);

        if (blockChequeInterest) {
          const net = parseFloat(v.amount || "0") || 0;
          const rawFromUser = parseFloat(v.raw_amount || "") || net;
          m = {
            ...m,
            raw: rawFromUser,
            net_amount: net,
            interest_amount: 0,
            interest_pct: 0,
            days_charged: 0,
          };
        }

        chequeInterestTotal += m.interest_amount;
        valuesRawTotal += m.raw;

        return {
          ...common,
          amount: round2(m.net_amount),
          raw_amount: round2(m.raw),
          cheque: {
            collection_date: v.chequeDate || null,
            days_total: m.days_total,
            grace_days: m.grace_days_used ?? checkGraceValue,
            days_charged: m.days_charged,
            annual_interest_pct: annualInterestPct,
            daily_rate: round4(m.daily),
            interest_pct: round4(m.interest_pct),
            interest_amount: round2(m.interest_amount),
            net_amount: round2(m.net_amount),
            cheque_number: v.chequeNumber || undefined,
          },
        };
      });

      // ===== PROMO por CHEQUES =====
      const minDaysAtReceipt = (() => {
        const xs = (computedDiscounts || [])
          .map((d) => (typeof d?.days === "number" ? d.days : undefined))
          .filter((v) => typeof v === "number") as number[];
        return xs.length ? Math.min(...xs) : undefined;
      })();

      const invoiceIssueDateApprox = inferInvoiceIssueDate(
        receiptDate,
        minDaysAtReceipt
      );

      let chequePromoDiscountTotal = 0;

      const chequePromoAnnotations: Array<{
        index: number;
        promo_rate: number;
        promo_amount: number;
      }> = [];

      newValues.forEach((v, idx) => {
        if (v.method !== "cheque") return;

        const promoRate = getChequePromoRate({
          invoiceAgeAtReceiptDaysMin: minDaysAtReceipt,
          invoiceIssueDateApprox,
          receiptDate,
          chequeDate: v.chequeDate || null,
        });

        if (promoRate > 0) {
          const raw = parseFloat(v.raw_amount || "");
          const net = parseFloat(v.amount || "");
          const baseForPromo =
            Number.isFinite(raw) && raw > 0
              ? raw
              : Number.isFinite(net)
              ? net
              : 0;

          const promoAmount = round2(baseForPromo * promoRate);

          if (promoAmount > 0) {
            chequePromoDiscountTotal += -promoAmount;
            chequePromoAnnotations.push({
              index: idx,
              promo_rate: promoRate,
              promo_amount: promoAmount,
            });
          }
        }
      });

      // --- Totales base ---
      const gross = round2(totalBase);
      const docAdjTotal = round2(docAdjustmentSigned);
      const valuesNominal = round2(valuesRawTotal);

      const netFromValues = round2(
        valuesNominal - Math.abs(chequeInterestTotal || 0)
      );

      const valuesNetTotal = newValues.reduce(
        (acc, v) => acc + (parseFloat(v.amount || "0") || 0),
        0
      );
      const valuesNetNonCheque = newValues.reduce(
        (acc, v) =>
          acc + (v.method !== "cheque" ? parseFloat(v.amount || "0") || 0 : 0),
        0
      );

      const isDiscountContext = docAdjTotal > 0;
      const isSurchargeContext = docAdjTotal < 0;
      const hasCheques = newValues.some((v) => v.method === "cheque");

      const totalToPay = round2(totalNetForUI);

      const threshold = isDiscountContext && !hasCheques ? totalToPay : gross;

      const valuesDoNotReachTotal =
        Math.round(netFromValues * 100) < Math.round(threshold * 100);

      let discountAmt = 0;
      const rate = gross > 0 ? docAdjTotal / gross : 0;

      if (isDiscountContext) {
        const discountOnCashOnly = -round2(valuesNetNonCheque * rate);

        if (hasCheques) {
          discountAmt = discountOnCashOnly;
        } else {
          discountAmt = valuesDoNotReachTotal
            ? discountOnCashOnly
            : -docAdjTotal;
        }
      } else if (isSurchargeContext) {
        const recargoSobreValores = -1 * (valuesNetTotal * rate);
        discountAmt = valuesDoNotReachTotal
          ? recargoSobreValores
          : -docAdjTotal;
      }

      const discountAmtWithChequePromo = round2(
        discountAmt + chequePromoDiscountTotal
      );

      const totalDescCostF =
        (typeof discountAmtWithChequePromo === "number"
          ? discountAmtWithChequePromo
          : 0) +
        (typeof chequeInterestTotal === "number" ? chequeInterestTotal : 0);

      const netToApply = round2(valuesNominal - totalDescCostF);

      const saldoDiff = round2(gross - netToApply);

      const totals = {
        gross,
        discount: docAdjTotal,
        discount_applied_to_values: discountAmtWithChequePromo,
        net: round2(totalNetForUI),
        values: round2(totalValues),
        values_raw: valuesNominal,
        cheque_grace_days: checkGraceValue,
        cheque_interest: round2(chequeInterestTotal),
        interest_annual_pct: annualInterestPct,
        net_to_apply: round2(netToApply),
        diff: saldoDiff,
      };

      const payload = {
        status: "pending",
        type: paymentTypeUI,
        date: new Date(),
        currency: "ARS",
        comments,
        source: "web",
        customer: {
          id: String(selectedClientId),
          name: customerName || "",
        },
        user: { id: String(userId) },
        seller: { id: String(sellerId) },
        payment_condition: { id: getPaymentConditionId() },
        totals,
        total: round4(totalNetForUI),
        documents: computedDiscounts.map((d) => ({
          document_id: d.document_id,
          number: d.number,
          days_used: isNaN(d.days) ? undefined : d.days,
          rule_applied: buildRuleApplied(
            d.days,
            paymentTypeUI,
            d.noDiscountBlocked,
            d.manualTenApplied
          ),
          base: round2(d.base),
          discount_rate: round4(d.rate),
          discount_amount: round2(d.signedAdjustment),
          final_amount: round2(d.finalAmount),
          note: d.note || undefined,
        })),
        values: valuesPayload,
      } as any;

      const created = await createPayment(payload).unwrap();

      const now = new Date();
      const longDescription = buildPaymentNotificationFromPayment(created);

      await addNotificationToCustomer({
        customerId: String(selectedClientId),
        notification: {
          title: `PAGO REGISTRADO`,
          type: "PAGO",
          description: longDescription,
          link: "/payments",
          schedule_from: now,
          schedule_to: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      }).unwrap();

      await addNotificationToUserById({
        id: "67a60be545b75a39f99a485b",
        notification: {
          title: "PAGO REGISTRADO",
          type: "PAGO",
          description: `${longDescription}`,
          link: "/payments",
          schedule_from: now,
          schedule_to: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          customer_id: String(selectedClientId),
        },
      }).unwrap();

      onSuccess?.();
    } catch (e) {
      console.error("CreatePayment error:", e);
      alert(
        "No se pudo crear el pago. Revisá enums/minúsculas y los IDs anidados."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleCreatePayment,
    isProcessingPayment: isSubmitting || isCreating,
  };
}

function buildRuleApplied(
  days: number,
  paymentTypeUI: PaymentType,
  blockedNoDiscount = false,
  manualTenPct = false
) {
  if (blockedNoDiscount) return `${paymentTypeUI}:cond_pago_sin_descuento`;
  if (paymentTypeUI === "pago_anticipado") return "pago_anticipado:sin_regla";
  if (manualTenPct) return "cta_cte:30-37d:10%:manual";
  if (isNaN(days)) return "cta_cte:invalido";

  if (days <= 7) return `cta_cte:<=7d:20%`; // ojo: la lógica de 13% promo 15/10 ya está en rate del descuento
  if (days <= 15) return "cta_cte:<=15d:13%";
  if (days <= 30) return "cta_cte:<=30d:10%";
  if (days > 45) return "cta_cte:>45d:actualizacion";
  return "cta_cte:0%";
}
