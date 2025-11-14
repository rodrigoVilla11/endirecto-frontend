"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DocumentsView } from "./DocumentsView";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerInformationByCustomerIdQuery } from "@/redux/services/customersInformations";
import ValueView, { ValueItem } from "./ValueView";
import { CommentsView } from "./CommentsView";
import { useTranslation } from "react-i18next";
import { useCreatePaymentMutation } from "@/redux/services/paymentsApi";
import { createPortal } from "react-dom";
import { useAuth } from "@/app/context/AuthContext";
import {
  useAddNotificationToCustomerMutation,
  useGetCustomerByIdQuery,
} from "@/redux/services/customersApi";
import { useAddNotificationToUserByIdMutation } from "@/redux/services/usersApi";
import {
  useGetInterestRateQuery,
  useGetChequeGraceDaysQuery,
  useGetDocumentsGraceDaysQuery,
} from "@/redux/services/settingsApi";
import { diffFromDateToToday } from "@/lib/dateUtils";
import { InfoIcon } from "lucide-react";
import Modal from "@/app/components/components/Modal";
import PlanCalculator from "@/app/finance/planCaluculator";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}
function normalizeAnnualPct(x: number) {
  // Si viene como fracción diaria (0 < x < 1), convierto a % anual
  if (x > 0 && x < 1) return x * 365 * 100;
  return x; // ya es % anual
}
const dailyRateFromAnnual = (annualInterestPct: number) => {
  const annualPct = normalizeAnnualPct(annualInterestPct); // % anual
  return annualPct / 100 / 365; // fracción diaria
};

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { t } = useTranslation();
  // 🔁 Valores primero
  const [activeTab, setActiveTab] = useState<
    "documents" | "values" | "comments"
  >("documents");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { selectedClientId } = useClient();
  const [comments, setComments] = useState("");
  const [totalFinal, setTotalFinal] = useState(0);
  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
  const [addNotificationToCustomer] = useAddNotificationToCustomerMutation();
  const [addNotificationToUserById] = useAddNotificationToUserByIdMutation();
  const [graceDiscount, setGraceDiscount] = useState<Record<string, boolean>>(
    {}
  );
  const [isValuesValid, setIsValuesValid] = useState(true);
  const { data: checkGrace } = useGetChequeGraceDaysQuery();
  const { data: documentsGrace } = useGetDocumentsGraceDaysQuery();
  const [showRefi, setShowRefi] = useState(false);
  const [openModalRefi, setOpenModalRefi] = useState(false);

  const openCreateModal = useCallback(() => setOpenModalRefi(true), []);
  const closeCreateModal = useCallback(() => {
    setOpenModalRefi(false);
  }, []);

  type PaymentType = "pago_anticipado" | "cta_cte";

  const { data: interestSetting } = useGetInterestRateQuery();

  useEffect(() => {
    if (typeof interestSetting?.value === "number") {
      setAnnualInterestPct(interestSetting.value);
      localStorage.setItem(
        "interest_annual_pct",
        String(interestSetting.value)
      );
    } else {
      const cached = Number(localStorage.getItem("interest_annual_pct"));
      if (!isNaN(cached)) setAnnualInterestPct(cached);
    }
  }, [interestSetting]);

  const [paymentTypeUI, setPaymentTypeUI] = useState<PaymentType>("cta_cte"); // o "pago_anticipado" si preferís
  // ✅ eliminar: ContraEntregaOption, contraEntregaOpt, contraEntregaMonto
  // Documentos seleccionados (llenados por DocumentsView)
  const [newPayment, setNewPayment] = useState<
    {
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
    }[]
  >([]);

  const [annualInterestPct, setAnnualInterestPct] = useState<number>(96);
  const annualInterest = annualInterestPct / 100;

  // Valores ingresados
  type PaymentMethod = "efectivo" | "transferencia" | "cheque";
  type ValueItem = {
    /** Monto imputable (para cheque = neto) */
    amount: string;
    /** Solo cheques: monto original ingresado */
    raw_amount?: string;
    /** Solo cheques: fecha de cobro */
    chequeDate?: string;

    selectedReason: string;
    method: PaymentMethod;
    bank?: string;

    /** adjuntos */
    receiptUrl?: string;
    receiptOriginalName?: string;
    chequeNumber?: string;
    overrideGraceDays?: number;
    cf?: number;
  };

  const [newValues, setNewValues] = useState<ValueItem[]>([]);

  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [submittedPayment, setSubmittedPayment] = useState(false);

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

  const [grace, setGrace] = useState<number>();
  function computeChequeMeta(v: ValueItem) {
    const days_totals = daysBetweenToday(v.chequeDate);
    const days_total = days_totals + 1;

    // 👇 prioridad al override por ítem; si no, usa el setting global
    const grace = Number.isFinite(v.overrideGraceDays as any)
      ? (v.overrideGraceDays as number)
      : checkGrace?.value ?? 45;
    setGrace(grace);
    const days_charged = Math.max(0, days_total - grace);

    const annualNorm = normalizeAnnualPct(annualInterestPct);
    const daily = annualNorm / 100 / 365;
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
      // 👇 útil si querés inspeccionarlo luego
      grace_days_used: grace,
    };
  }

  const currencyFmt = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // ⛔️ Si hay documentos seleccionados, bloquear contra_entrega y forzar cta_cte
  const hasSelectedDocs = newPayment.length > 0;
  useEffect(() => {
    if (hasSelectedDocs && paymentTypeUI === "pago_anticipado") {
      setPaymentTypeUI("cta_cte");
    }
  }, [hasSelectedDocs, paymentTypeUI]);

  const isNoDiscountCondition = (txt?: string) => {
    const v = (txt || "").toLowerCase().trim();
    return (
      v === "segun pliego" ||
      v === "cuenta corriente" || // por si viene con tilde
      v === "no especificado" ||
      v === "not specified"
    );
  };

  function getDocDays(doc: {
    days_until_expiration_today?: any;
    date?: string;
  }) {
    const v = Number(doc.days_until_expiration_today);
    if (Number.isFinite(v)) return v;
    return diffFromDateToToday(doc.date); // 👈 antes: daysFromInvoice
  }
  const { userData } = useAuth();

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const round4 = (n: number) =>
    Math.round((n + Number.EPSILON) * 10000) / 10000;

  // TODO: reemplazá por tu fuente real (AuthContext / Redux / NextAuth)
  const getCurrentUserId = () => {
    return userData?._id || "";
  };

  // TODO: si en tu app la condición de pago es un registro real, poné su ID de DB acá.
  // Por ahora mando un id simbólico según la UI:
  const getPaymentConditionId = () =>
    paymentTypeUI === "cta_cte" ? "cta_cte" : "pago_anticipado";

  // Regla usada (string descriptivo)
  // antes: const buildRuleApplied = (days: number, blockedNoDiscount = false) => {
  const buildRuleApplied = (
    days: number,
    blockedNoDiscount = false,
    manualTenPct = false,
    promo1310 = false
  ) => {
    if (blockedNoDiscount) return `${paymentTypeUI}:cond_pago_sin_descuento`;
    if (paymentTypeUI === "pago_anticipado") return "pago_anticipado:sin_regla";
    if (manualTenPct) return "cta_cte:30-37d:10%:manual";
    if (isNaN(days)) return "cta_cte:invalido";

    if (days <= 7) return `cta_cte:<=7d:${promo1310 ? "13%" : "20%"}`;
    if (days <= 15) return "cta_cte:<=15d:13%";
    if (days <= 30) return "cta_cte:<=30d:10%";
    if (days > 45) return "cta_cte:>45d:actualizacion";
    return "cta_cte:0%";
  };
  const { data: customer } = useGetCustomerByIdQuery(
    { id: selectedClientId ?? "" },
    { skip: !selectedClientId }
  );
  const canSend = isValuesValid && newValues.length > 0;

  /** Notificación basada SOLO en el JSON de payment (sin cálculos) */
  function buildPaymentNotificationFromPayment(payment: any): string {
    // ===== Helpers =====
    const fmtMoney = (n?: number) =>
      typeof n === "number"
        ? new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: String(payment?.currency || "ARS"),
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(n)
        : "—";

    const ddmmyy = (dateLike: any): string => {
      try {
        const d =
          typeof dateLike === "string" || typeof dateLike === "number"
            ? new Date(dateLike)
            : dateLike instanceof Date
            ? dateLike
            : new Date();
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
      } catch {
        return "—";
      }
    };

    const r2 = (n: number) => Math.round(n * 100) / 100;

    // ===== Safe getters =====
    const totals = payment?.totals ?? {};
    const documents: any[] = Array.isArray(payment?.documents)
      ? payment.documents
      : [];
    const values: any[] = Array.isArray(payment?.values) ? payment.values : [];

    const paymentId = payment?.id || payment?._id || payment?.number || "—";
    const when = payment?.date || new Date();

    const cliente = payment?.customer?.name || payment?.customer?.id || "—";
    const vendedor =
      payment?.seller?.name || payment?.seller?.id || payment?.seller_id || "—";
    const usuario =
      payment?.user?.name ||
      payment?.user?.id ||
      payment?.user?.user_id ||
      payment?.user_id ||
      "—";

    // ===== Totales de backend (con fallbacks) =====
    const gross = Number(totals?.gross) || 0; // Documentos base
    const docsAdjTotal = Number(totals?.discount) || 0; // +desc / -rec total docs
    const docsFinal = Number(totals?.net) || r2(gross - docsAdjTotal);
    const valuesRawBackend = Number(totals?.values_raw) || 0; // suma nominal
    const chequeInterest = Number(totals?.cheque_interest) || 0;

    // Si no vino values_raw, lo reconstruimos (nominal cheques = raw, otros = amount)
    const valuesRaw =
      valuesRawBackend ||
      values.reduce((acc, v) => {
        const m = String(v?.method || "").toLowerCase();
        if (m === "cheque") {
          const raw =
            typeof v?.raw_amount === "number"
              ? v.raw_amount
              : typeof v?.cheque?.net_amount === "number"
              ? r2((v.cheque.net_amount || 0) + (v.cheque.interest_amount || 0))
              : Number(v?.amount) || 0;
          return acc + raw;
        }
        return acc + (Number(v?.amount) || 0);
      }, 0);

    // ===== Desc/Cost F. aplicado a valores — con fallback para RECARGO + cheques =====
    // Backend ideal: totals.discount_applied_to_values
    let appliedAdjToValues = Number(totals?.discount_applied_to_values) || 0;

    const hasCheques = values.some(
      (v) => String(v?.method || "").toLowerCase() === "cheque"
    );
    const isSurcharge = docsAdjTotal < 0; // recargo en docs
    // En recargo, si el neto aportado por los valores alcanza el bruto de docs,
    // el ajuste aplicado a valores debe ser el recargo total (abs(discount)).
    const netFromValues = r2(valuesRaw - Math.abs(chequeInterest)); // nominal - CF cheques
    const reachesGross =
      Math.round(netFromValues * 100) >= Math.round(gross * 100);

    if (appliedAdjToValues === 0 && isSurcharge && hasCheques && reachesGross) {
      // fallback: usar el recargo total de documentos como ajuste sobre valores
      appliedAdjToValues = Math.abs(docsAdjTotal);
    }

    // ===== Acumulados y derivados (seguimos la “plantilla oficial”) =====
    const totalDescCF = r2(appliedAdjToValues + chequeInterest);
    const netToApply = r2(valuesRaw - totalDescCF); // = "Neto a aplicar Factura"
    const saldoDiff = r2(gross - netToApply);

    // ===== Días y % para cabecera =====
    const docRate =
      typeof documents?.[0]?.discount_rate === "number"
        ? documents[0].discount_rate
        : gross > 0
        ? docsAdjTotal / gross
        : 0;

    let daysWeighted = 0;
    if (documents.length > 0) {
      let baseSum = 0;
      let acc = 0;
      for (const d of documents) {
        const b = typeof d?.base === "number" ? d.base : 0;
        const dy =
          typeof d?.days_used === "number"
            ? d.days_used
            : typeof d?.days === "number"
            ? d.days
            : undefined;
        if (b > 0 && typeof dy === "number") {
          baseSum += b;
          acc += b * dy;
        }
      }
      daysWeighted = baseSum > 0 ? Math.round((acc / baseSum) * 100) / 100 : 0;
    }

    // ===== Texto =====
    const lines: string[] = [];
    lines.push(`Fecha: ${ddmmyy(when)}`);
    lines.push(`ID Pago: ${paymentId}`);
    lines.push(`Cliente: ${cliente}`);
    lines.push(`Vendedor: ${vendedor}`);
    lines.push(`Usuario: ${usuario}`);
    lines.push("");

    // Documentos
    lines.push(`Documentos: ${fmtMoney(gross)}`);
    if (gross > 0 && docsAdjTotal !== 0) {
      const pctTxt = `${(docRate * 100).toFixed(2)}%`;
      lines.push(`Desc/Costo Financiero: ${daysWeighted || 0} - ${pctTxt}`);
      lines.push(`Desc/Costo Financiero por pago efect/transf: ${fmtMoney(Math.abs(docsAdjTotal))}`);
    }
    lines.push(`TOTAL A PAGAR (efect/transf): ${fmtMoney(docsFinal)}`);
    lines.push(`-------------------------------------------`);

    // Composición
    lines.push(`COMPOSICION DEL PAGO`);
    values.forEach((v) => {
      const method = String(v?.method || "").toLowerCase();
      if (method === "cheque") {
        const ch = v?.cheque || {};
        const dTxt = ch?.collection_date ? ddmmyy(ch.collection_date) : "—";
        // nominal
        const nominal =
          typeof v?.raw_amount === "number"
            ? v.raw_amount
            : typeof ch?.net_amount === "number"
            ? r2((ch.net_amount || 0) + (ch.interest_amount || 0))
            : Number(v?.amount) || 0;

        lines.push(`Cheque ${dTxt}: ${fmtMoney(nominal)}`);
        const daysCharged =
          typeof ch?.days_charged === "number" ? ch.days_charged : undefined;
        const pct =
          typeof ch?.interest_pct === "number"
            ? `${(ch.interest_pct * 100).toFixed(2)}%`
            : undefined;
        if (typeof daysCharged === "number" || pct) {
          lines.push(`Costo Financiero: ${daysCharged ?? "—"} - ${pct ?? "—"}`);
        }
        lines.push(`Costo Financiero: ${fmtMoney(ch?.interest_amount || 0)}`);
        lines.push(`-------------------------------------------`);
      } else {
        const label = method === "transferencia" ? "Transferencia" : "Efectivo";
        lines.push(`${label}: ${fmtMoney(Number(v?.amount) || 0)}`);
        lines.push(`-------------------------------------------`);
      }
    });

    // Totales finales (plantilla oficial)
    lines.push(`Total Pagado (Nominal): ${fmtMoney(valuesRaw)}`);
    lines.push(`Desc/Cost F.: ${fmtMoney(appliedAdjToValues)}`);
    if (chequeInterest) {
      lines.push(`Cost F. Cheques: ${fmtMoney(chequeInterest)}`);
    }
    if (totalDescCF) {
      lines.push(`Total Desc/Cost F.: ${fmtMoney(totalDescCF)}`);
    }
    lines.push(`Neto a aplicar Factura: ${fmtMoney(netToApply)}`);
    lines.push(`SALDO: ${fmtMoney(saldoDiff)}`);

    return lines.join("\n");
  }

  // ——— helpers fecha ———
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const toYMD = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // Dado el mínimo "days" de los documentos, inferimos fecha de emisión aproximada
  function inferInvoiceIssueDate(receiptDate: Date, minDaysAtReceipt?: number) {
    if (typeof minDaysAtReceipt !== "number" || !isFinite(minDaysAtReceipt))
      return undefined;
    const d = new Date(receiptDate.getTime() - minDaysAtReceipt * MS_PER_DAY);
    return toYMD(d);
  }

  // Regla de PROMO por cheque, según tus 3 casos:
  // A) 0–7 días la factura (al recibo) Y cheque ≤30 días desde emisión → 13%
  // B) 7–15 días factura (al recibo) Y cheque “al día” (mismo día recibo) → 13%
  // C) 15–30 días factura (al recibo) Y cheque “al día” → 10%
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

    // ✅ “Cheque al día”: diferencia de hasta ±1 día (por zona horaria o margen operativo)
    const diffDays = Math.abs(cd.getTime() - rd.getTime()) / MS_PER_DAY;
    const isSameDayLoose = diffDays <= 1;

    if (typeof age === "number") {
      // 🟩 Caso A: factura 0–7 días + cheque ≤30 días desde emisión → 13%
      if (age >= 0 && age <= 7 && invoiceIssueDateApprox) {
        const daysFromIssueToCheque = Math.round(
          (cd.getTime() - invoiceIssueDateApprox.getTime()) / MS_PER_DAY
        );
        if (daysFromIssueToCheque <= 30) return 0.13;
      }

      // 🟨 Caso B: factura 7–15 días + cheque al día (±1 día) → 13%
      if (age > 7 && age <= 15 && isSameDayLoose) return 0.13;

      // 🟧 Caso C: factura 16–30 días + cheque al día (±1 día) → 10%
      if (age > 15 && age <= 30 && isSameDayLoose) return 0.1;
    }

    return 0;
  }

  const handleCreatePayment = async () => {
    if (isCreating || isSubmittingPayment) return;

    const userId = getCurrentUserId();
    if (!userId) return alert("Falta user.id (logueo).");
    if (!selectedClientId) return alert("Falta customer.id.");
    if (newValues.length === 0) return alert("Agregá al menos un valor.");

    setIsSubmittingPayment(true);
    try {
      let valuesRawTotal = 0; // suma de montos originales (cheque usa raw)
      let chequeInterestTotal = 0; // suma de intereses calculados en cheques

      // ——— Valores ———
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

        // 👉 CHEQUE
        let m = computeChequeMeta(v);
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
            grace_days: m.grace_days_used ?? checkGrace?.value,
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

      // ====== PROMO por CHEQUES (según reglas) ======
      const receiptDate = receiptDateRef.current; // la fecha del recibo (ya la estás usando en payload)
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

      // Sumar promo por cada cheque elegible, basado en RAW (nominal) cuando esté disponible
      let chequePromoDiscountTotal = 0;

      // Si querés además dejar trazabilidad por valor (opcional):
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
            // Es DESCUENTO → se suma como negativo en "applied to values"
            chequePromoDiscountTotal += -promoAmount;

            // Guardar para anotar en el valuesPayload (opcional)
            chequePromoAnnotations.push({
              index: idx,
              promo_rate: promoRate,
              promo_amount: promoAmount,
            });
          }
        }
      });

      // ——— Totales base ———
      const gross = round2(totalBase); // base documentos
      const docAdjTotal = round2(docAdjustmentSigned); // +desc / -rec total documentos
      const valuesNominal = round2(valuesRawTotal); // suma nominal (cheques usan raw)
      const docAdjRate = gross > 0 ? docAdjTotal / gross : 0;

      // Neto aportado por valores (nominal - interés cheques)
      const netFromValues = round2(
        valuesNominal - Math.abs(chequeInterestTotal || 0)
      );

      // Totales netos ingresados
      const valuesNetTotal = newValues.reduce(
        (acc, v) => acc + (parseFloat(v.amount || "0") || 0),
        0
      );
      const valuesNetNonCheque = newValues.reduce(
        (acc, v) =>
          acc + (v.method !== "cheque" ? parseFloat(v.amount || "0") || 0 : 0),
        0
      );

      // Contextos
      const isDiscountContext = docAdjTotal > 0;
      const isSurchargeContext = docAdjTotal < 0;
      const hasCheques = newValues.some((v) => v.method === "cheque");

      // Total a pagar (docsFinal) para comparar cuando hay DESCUENTO sin cheques
      const totalToPay = round2(totalNetForUI); // docsFinal = gross - docAdjTotal

      // Umbral: si hay DESCUENTO y NO hay cheques → comparar contra docsFinal, si no → gross
      const threshold = isDiscountContext && !hasCheques ? totalToPay : gross;

      // Redondeo a centavos en la comparación
      const valuesDoNotReachTotal =
        Math.round(netFromValues * 100) < Math.round(threshold * 100);

      // ——— Cálculo del ajuste aplicado a valores ———
      let discountAmt = 0;
      const rate = gross > 0 ? docAdjTotal / gross : 0;

      if (isDiscountContext) {
        const discountOnCashOnly = -round2(valuesNetNonCheque * rate);

        if (hasCheques) {
          // Mixto: descuento SOLO sobre efectivo/transfer
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
      // Total Desc/CF = desc/rec aplicado + intereses cheques
      const totalDescCostF =
        (typeof discountAmtWithChequePromo === "number"
          ? discountAmtWithChequePromo
          : 0) +
        (typeof chequeInterestTotal === "number" ? chequeInterestTotal : 0);

      // Neto a aplicar = nominal - (desc/rec aplicado + intereses cheques)
      // (si descuentoAmt es negativo, suma: 100k - (-20k) = 120k)
      const netToApply = round2(valuesNominal - totalDescCostF);

      // Saldo = gross - neto aplicado
      const saldoDiff = round2(gross - netToApply);

      // Debug útil

      // ——— Totales para payload ———
      const totals = {
        gross, // documentos base
        discount: docAdjTotal, // ajuste total documentos
        discount_applied_to_values: discountAmtWithChequePromo, // ajuste aplicado a valores
        net: round2(totalNetForUI), // docsFinal (header)
        values: round2(totalValues), // suma de valores (cheques ya netos)
        values_raw: valuesNominal, // nominales (cheques raw)
        cheque_grace_days: checkGrace?.value,
        cheque_interest: round2(chequeInterestTotal),
        interest_annual_pct: annualInterestPct,
        net_to_apply: round2(netToApply),
        diff: saldoDiff,
      };

      console.log({ totals });
      // ——— Payload final ———
      const payload = {
        status: "pending",
        type: paymentTypeUI,
        date: new Date(),
        currency: "ARS",
        comments,
        source: "web",
        customer: { id: String(selectedClientId), name: customer?.name || "" },
        user: { id: String(userId) },
        seller: { id: String(userData?.seller_id) },
        payment_condition: { id: getPaymentConditionId() },
        totals,
        total: round4(totalNetForUI),
        documents: computedDiscounts.map((d) => ({
          document_id: d.document_id,
          number: d.number,
          days_used: isNaN(d.days) ? undefined : d.days,
          rule_applied: buildRuleApplied(
            d.days,
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

      // console.log("Payment payload:", payload);
      const created = await createPayment(payload).unwrap();

      // ===== Datos para armar el texto =====
      const now = new Date();

      // Armamos el texto EXACTO
      const longDescription = buildPaymentNotificationFromPayment(created);

      // ===== Notificación al cliente =====
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

      setIsConfirmModalOpen(false);
      setSubmittedPayment(true);
      setNewValues([]);
      setNewPayment([]);
      setSelectedRows([]);
      setComments("");
      onClose();
    } catch (e) {
      console.error("CreatePayment error:", e);
      alert(
        "No se pudo crear el pago. Revisá enums/minúsculas y los IDs anidados."
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  function isPromo1310(txt?: string) {
    const v = (txt || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // saca tildes

    // Busca la estructura: "promo" + "15 dias" + "13" + "30 d" + "10"
    return (
      v.includes("promo") &&
      /15\s*dias/.test(v) &&
      /13(\s*%|.*dto)/.test(v) &&
      /30\s*d/.test(v) &&
      /10(\s*%|)/.test(v)
    );
  }
  function getAdjustmentRate(
    days: number,
    type: PaymentType,
    docPaymentCondition?: string,
    forceTenPct: boolean = false
  ): { rate: number; note?: string } {
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

    // 👇 cambio pedido: si es la promo 15/13% & 30D/10%, para <=7 días usar 13% en vez de 20%
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

  const computedDiscounts = newPayment.map((doc) => {
    const days = getDocDays(doc);
    const noDiscountBlocked = isNoDiscountCondition(doc.payment_condition);

    // elegible para checkbox: cta_cte, sin bloqueo, 31–37 días
    const eligibleManual10 =
      paymentTypeUI === "cta_cte" &&
      !noDiscountBlocked &&
      Number.isFinite(days) &&
      days > 30 &&
      days <= 37;

    const forceTen = !!graceDiscount[doc.document_id] && eligibleManual10;

    const { rate, note } = getAdjustmentRate(
      days,
      paymentTypeUI,
      doc.payment_condition,
      forceTen // 👈
    );

    const base = parseFloat(doc.saldo_a_pagar || "0") || 0;
    const signedAdjustment = +(base * rate).toFixed(2);
    const finalAmount = +(base - signedAdjustment).toFixed(2);

    return {
      document_id: doc.document_id,
      number: doc.number,
      days,
      base,
      rate, // +descuento / -recargo
      signedAdjustment,
      finalAmount,
      note,
      noDiscountBlocked,
      eligibleManual10, // 👈 para la UI
      manualTenApplied: forceTen, // 👈 para payload/regla
    };
  });
  // ===== TOTALES (ajuste aplicado sobre VALORES prorrateado por documento) =====
  const blockChequeInterest = computedDiscounts.some(
    (d) => d.noDiscountBlocked
  );

  // total base de documentos
  const totalBase = computedDiscounts.reduce((a, d) => a + d.base, 0);

  const valuesNetNonChequeUI = useMemo(
    () =>
      newValues.reduce(
        (acc, v) =>
          acc + (v.method !== "cheque" ? parseFloat(v.amount || "0") || 0 : 0),
        0
      ),
    [newValues]
  );

  // total de valores ingresados
  const totalValues = newValues.reduce(
    (total, v) => total + parseFloat(v.amount || "0"),
    0
  );

  // 🔑 Nueva versión: reparte cada valor proporcionalmente entre documentos
  function computeAdjustmentOnValuesFull(values: ValueItem[], docs: any[]) {
    const valuesTotal = values.reduce(
      (a, v) => a + parseFloat(v.amount || "0"),
      0
    );
    if (valuesTotal <= 0 || docs.length === 0) return 0;

    // Ajuste por documentos (sobre BASE)
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

    // Base para aplicar:
    //   - descuento: solo NO-cheques
    //   - recargo: todos
    const sumNonCheque = values.reduce(
      (a, v) => a + (v.method !== "cheque" ? parseFloat(v.amount || "0") : 0),
      0
    );

    const baseForAdj = globalRateOnBase > 0 ? sumNonCheque : valuesTotal;

    // Convención UI "sobre valores": descuento < 0, recargo > 0
    const adjOnValues = baseForAdj * globalRateOnBase * -1;

    // redondeo a 2 decimales
    return Math.round((adjOnValues + Number.EPSILON) * 100) / 100;
  }

  // 2) AJUSTE TOTAL aplicado sobre VALORES
  const rawAdjustmentOnValues = computeAdjustmentOnValuesFull(
    newValues,
    computedDiscounts
  );

  // (UI)
  const formattedTotalGross = currencyFmt.format(totalBase);

  const { data } = useGetCustomerInformationByCustomerIdQuery({
    id: selectedClientId ?? undefined,
  });

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedRows((prev) =>
      checked ? [...prev, id] : prev.filter((rowId) => rowId !== id)
    );
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  function dateISOPlusDays(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  function mergeRefiCheques(cheques: ValueItem[]) {
    setNewValues((prev) => {
      const keep = prev.filter((v) => !(v.method === "cheque"));
      return [...keep, ...cheques];
    });
    setActiveTab("values");
    setShowRefi(false);
  }
  // 👇 reordenamos tabs: Valores, Comprobantes, Comentarios
  const tabsOrder: Array<"values" | "documents" | "comments"> = [
    "documents",
    "values",
    "comments",
  ];

  const totalDocsFinal = computedDiscounts.reduce(
    (acc, d) => acc + d.finalAmount,
    0
  );

  // Flag para saber si estamos en “pagar total por comprobante”
  const [payTotalDocMode, setPayTotalDocMode] = useState(false);

  // Si el usuario modifica los valores, salimos del modo “pagar total”
  useEffect(() => {
    if (newValues.length !== 1) {
      setPayTotalDocMode(false);
      return;
    }
    const only = parseFloat(newValues[0].amount || "0");
    if (Math.abs(only - round2(totalDocsFinal)) > 0.01)
      setPayTotalDocMode(false);
  }, [newValues, totalDocsFinal]);

  // Razones estandarizadas (evita strings mágicos en varios lugares)
  const PAY_TOTAL_REASON = "Pago total a factura";
  const NO_REASON = "Sin Concepto";

  const EPS = 0.01;

  function isPayTotalItem(v: ValueItem) {
    return v.selectedReason === PAY_TOTAL_REASON && v.method === "efectivo";
  }
  // Si el valor generado por "Pagar total" cambia de monto,
  // cambiamos también su concepto a "Sin Concepto" y salimos del modo.
  // Si cambia el monto del item de "Pagar total", renombrá el concepto
  useEffect(() => {
    // debe existir EXACTAMENTE un valor y debe ser el de "pagar total"
    if (newValues.length !== 1) {
      setPayTotalDocMode(false);
      return;
    }

    const v = newValues[0];
    if (!isPayTotalItem(v)) {
      setPayTotalDocMode(false);
      return;
    }

    const amt = round2(parseFloat(v.amount || "0"));
    const docsFinal = round2(totalDocsFinal);

    // si el monto coincide (dentro de la tolerancia), activamos el modo
    setPayTotalDocMode(Math.abs(amt - docsFinal) <= EPS);
  }, [newValues, totalDocsFinal]);

  // Neto modelo “dto sobre valores”

  // Ajuste calculado por REGLA DE CADA COMPROBANTE (siempre visible)
  const docAdjustmentSigned = round2(totalBase - totalDocsFinal);

  // 👉 recargo pendiente por documentos (solo si hay recargo)
  const docSurchargePending = useMemo(() => {
    const gross = totalBase; // base de documentos
    const docAdjTotal = docAdjustmentSigned; // +desc / -rec (ya lo tenés)
    if (!(gross > 0) || !(docAdjTotal < 0)) return 0;

    // tasa absoluta de ajuste por documentos
    const rateAbs = Math.abs(docAdjTotal) / gross;

    // lo ya aplicado sobre los valores no-cheque
    const appliedSoFar = Math.round(valuesNetNonChequeUI * rateAbs * 100) / 100;

    // pendiente (cap a 2 dec)
    const pending = Math.max(0, Math.abs(docAdjTotal) - appliedSoFar);
    return Math.round(pending * 100) / 100;
  }, [totalBase, docAdjustmentSigned, valuesNetNonChequeUI]);

  // Si querés capear SIEMPRE:
  const totalAdjustmentSigned = capAdjustmentOnValues(
    rawAdjustmentOnValues,
    docAdjustmentSigned
  );

  function capAdjustmentOnValues(adjOnValues: number, docAdjSigned: number) {
    // docAdjSigned usa convención opuesta (+desc / -rec); lo pasamos a "sobre valores" (desc<0 / rec>0)
    const docAdjInValuesSign = -docAdjSigned;

    const limit = Math.abs(docAdjInValuesSign);
    const sign = Math.sign(adjOnValues) || 0;

    // devolvemos el menor por magnitud, manteniendo el signo de adjOnValues
    const capped = Math.min(Math.abs(adjOnValues), limit) * sign;
    // redondeo igual que el resto
    return Math.round((capped + Number.EPSILON) * 100) / 100;
  }

  const hasPartialPayment =
    totalValues > 0 && Math.abs(totalValues - round2(totalDocsFinal)) > 0.01;

  const showSobrePago = !payTotalDocMode && hasPartialPayment;
  const totalNetForUI = round2(totalDocsFinal);

  // Hay refinanciación si existe al menos un cheque marcado como "Refinanciación"
  const hasRefiValues = newValues.some(
    (v) => v.method === "cheque" && v.selectedReason === "Refinanciación"
  );
  const targetForRefi =
    docAdjustmentSigned < 0 ? round2(totalDocsFinal) : round2(totalBase);

  // Diferencia para refinanciación (contra el objetivo correcto)
  const diff = round2(targetForRefi - totalValues);

  // Saldo a refinanciar
  const remainingToRefi = Math.max(0, diff);

  // ¿Algún comprobante tiene menos de 45 días de emisión?
  // (si querés que sean TODOS <45, cambiá 'some' por 'every')
  const hasAnyUnder45Days = computedDiscounts.some(
    (d) => typeof d.days === "number" && d.days < 45
  );

  const hasInvoiceToday = useMemo(
    () =>
      computedDiscounts.some(
        (d) => typeof d.days === "number" && Math.round(d.days) === 0
      ),
    [computedDiscounts]
  );

  // Si hay <45 días, sumar el ajuste; si no, usar solo remainingToRefi
  const remainingToRefiWithSurchage = hasAnyUnder45Days
    ? remainingToRefi + totalAdjustmentSigned
    : remainingToRefi;

    console.log({remainingToRefiWithSurchage, remainingToRefi,totalAdjustmentSigned})
  // 2) Úsalo dentro de proposeChequesPreset
  function proposeChequesPreset(daysList: number[]) {
    // saldo restante a refinanciar
    const targetPV = remainingToRefi;

    if (!Array.isArray(computedDiscounts) || computedDiscounts.length === 0) {
      alert("No se puede refinanciar sin documentos seleccionados.");
      return;
    }
    if (!Array.isArray(daysList) || daysList.length === 0) {
      alert("Debes elegir al menos un plazo para los cheques (30/60/90, etc).");
      return;
    }
    if (targetPV <= 0) {
      alert("No hay saldo pendiente para refinanciar.");
      return;
    }

    // ⚠️ Reglas de gracia para REFINANCIACIÓN:
    // - Si hay “según pliego” => sin CF (gracia gigante)
    // - Si NO, en refi la gracia debe ser 0 (NO 10)
    const grace = blockChequeInterest ? 100000 : 0;

    const daily = dailyRateFromAnnual(annualInterestPct);

    function isoInDays(d: number) {
      const base = new Date();
      const dt = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate() + d
      );
      return dt.toISOString().slice(0, 10);
    }

    // === NOMINAL IGUAL PARA TODOS LOS CHEQUES ===
    // Para cada plazo, calculamos el "safeDen" (= 1 - interés aplicado)
    const denoms = daysList.map((d) => {
      const daysTotal = d;
      const daysCharged = Math.max(0, daysTotal - grace);
      const interestPct = daily * daysCharged;
      const safeDen = 1 - interestPct <= 0 ? 1 : 1 - interestPct; // evita 0/negativo
      return { d: daysTotal, daysCharged, interestPct, safeDen };
    });

    // Hallamos R (nominal común) tal que sum(R * safeDen_i) == targetPV
    const sumSafeDen = denoms.reduce((a, x) => a + x.safeDen, 0);
    const Rraw = sumSafeDen > 0 ? targetPV / sumSafeDen : targetPV;

    const cheques: ValueItem[] = [];
    let accNet = 0;

    for (let i = 0; i < denoms.length; i++) {
      const { d, safeDen } = denoms[i];

      // Nominal igual (redondeado a 2). El último ajusta centavos para cerrar exacto.
      let raw = round2(Rraw);
      let net = round2(raw * (safeDen <= 0 ? 1 : safeDen));

      if (i === denoms.length - 1) {
        // Ajuste final para que la suma de netos sea EXACTA a targetPV
        const neededNet = round2(targetPV - accNet);
        const safeDenLast = safeDen <= 0 ? 1 : safeDen;
        raw = round2(neededNet / safeDenLast);
        net = round2(raw * safeDenLast);
      }

      accNet += net;
      console.log({ raw, net });
      cheques.push({
        method: "cheque",
        selectedReason: "Refinanciación",
        amount: net.toFixed(2), // NETO imputable
        raw_amount: raw.toFixed(2), // NOMINAL (igual salvo ajuste final de centavos)
        chequeDate: isoInDays(d), // 30/60/90...
        overrideGraceDays: grace, // 0 en refi normal, 100000 si “según pliego”
        cf: raw - net, // 0 en refi normal, 100000 si “según pliego”
      });
    }

    // Verificación/mini-ajuste por si quedara un delta mínimo tras redondeos
    const sumNet = cheques.reduce((a, c) => a + parseFloat(c.amount), 0);
    const delta = round2(targetPV - sumNet);
    if (Math.abs(delta) >= 0.01) {
      const lastIdx = cheques.length - 1;
      const last = cheques[lastIdx];
      const safeDenLast =
        denoms[lastIdx].safeDen <= 0 ? 1 : denoms[lastIdx].safeDen;

      const newNet = round2(parseFloat(last.amount) + delta);
      const newRaw = round2(newNet / safeDenLast);

      last.amount = newNet.toFixed(2);
      last.raw_amount = newRaw.toFixed(2);
    }

    mergeRefiCheques(cheques);
  }

  const receiptDateRef = useRef<Date>(new Date());

  const docsDaysMin = useMemo(() => {
    if (!Array.isArray(computedDiscounts) || computedDiscounts.length === 0)
      return undefined;

    // Extraemos solo valores numéricos de días (días entre emisión y recibo)
    const daysArray = computedDiscounts
      .map((d) => (typeof d?.days === "number" ? d.days : undefined))
      .filter(
        (n): n is number =>
          typeof n === "number" && Number.isFinite(n) && n >= 0
      );

    // Devolvemos el mayor número de días de antigüedad (más vieja)
    return daysArray.length > 0 ? Math.max(...daysArray) : undefined;
  }, [computedDiscounts]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50"
      onClick={!isConfirmModalOpen ? onClose : undefined}
    >
      <div
        className="h-full flex flex-col bg-zinc-900 max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white">
              ←
            </button>
            <h2 className="text-xl font-semibold text-white">
              {t("paymentModal.headerTitle")}
            </h2>
          </div>
          <span className="text-white">📄</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="border-b border-zinc-800">
            <InfoRow label={t("paymentModal.date")} value={formattedDate} />
            <InfoRow
              label={
                <div className="flex items-center gap-2">
                  {t("paymentModal.gps")}{" "}
                  <span className="text-red-500">📍</span>
                </div>
              }
              value={
                <span className="text-yellow-500">
                  {t("paymentModal.noInsitu")}
                </span>
              }
            />

            {/* SUBTOTAL */}
            <InfoRow label="Total facturas" value={formattedTotalGross} />
            {/* <InfoRow label="Pagos" value={formattedTotalValues} /> */}

            {/* 3) Desc/Rec financiero ($ en pesos con signo) */}
            <InfoRow
              label={
                <LabelWithTip
                  label="Desc/Costo financiero"
                  tip={
                    showSobrePago
                      ? "Ajuste aplicado SOBRE EL PAGO cargado (prorrateado)."
                      : "Ajuste por COMPROBANTES según reglas por días."
                  }
                />
              }
              value={
                <div className="text-right">
                  {(() => {
                    const signedRaw = showSobrePago
                      ? docAdjustmentSigned < 0
                        ? totalAdjustmentSigned // recargo prorrateado
                        : hasRefiValues
                        ? 0
                        : totalAdjustmentSigned // descuento: 0 si refi, si no prorrateado
                      : docAdjustmentSigned;

                    // Normalizamos para UI: "desc" se muestra con signo "−" y en verde
                    const isDiscount = showSobrePago
                      ? signedRaw < 0
                      : signedRaw >= 0;

                    const displayAbs = Math.abs(signedRaw);
                    const text = `${isDiscount ? "−" : "+"}${currencyFmt.format(
                      displayAbs
                    )}`;
                    const cls = isDiscount
                      ? "text-emerald-400"
                      : "text-red-400";

                    return <div className={cls}>{text}</div>;
                  })()}
                </div>
              }
            />

            {/* <InfoRow
              label="Total a pagar a la fecha"
              value={currencyFmt.format(totalFinal)}
            /> */}
            <InfoRow
              label="TOTAL A PAGAR (efect/transf)"
              value={currencyFmt.format(round2(totalDocsFinal))}
            />

            {/* Valores y Diferencia (igual que antes) */}
            {/* <InfoRow
              label="Saldo"
              value={formattedDiff}
              valueClassName={
                diff === 0
                  ? "text-emerald-500"
                  : diff > 0
                  ? "text-amber-400"
                  : "text-red-500"
              }
            /> */}
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3">
            {tabsOrder.map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`p-4 text-sm font-medium ${
                  activeTab === tabKey
                    ? "bg-white text-black"
                    : "bg-zinc-900 text-white"
                }`}
              >
                {t(`paymentModal.tabs.${tabKey}`)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "documents" && (
              <div className="text-white">
                {data &&
                  "documents" in data &&
                  (data as any).documents.map((item: any) => (
                    <DocumentsView
                      key={item.id}
                      document_id={item.id}
                      customerInformation={item}
                      onRowSelect={handleRowSelect}
                      selectedRows={selectedRows}
                      setNewPayment={setNewPayment}
                      paymentType={paymentTypeUI}
                      graceDays={
                        documentsGrace?.value ? documentsGrace?.value : 45
                      }
                      annualInterestPct={
                        interestSetting?.value ? interestSetting.value : 0
                      }
                      setFinalAmount={setTotalFinal}
                      graceDiscount={graceDiscount}
                      setGraceDiscount={setGraceDiscount}
                    />
                  ))}
              </div>
            )}

            {activeTab === "values" && (
              <div className="text-white space-y-4">
                {/* Selector de condición */}
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-2 rounded ${
                      paymentTypeUI === "cta_cte"
                        ? "bg-white text-black"
                        : "bg-zinc-700 text-white"
                    }`}
                    onClick={() => setPaymentTypeUI("cta_cte")}
                  >
                    Cuenta corriente
                  </button>

                  <button
                    className={`px-3 py-2 rounded ${
                      paymentTypeUI === "pago_anticipado"
                        ? "bg-white text-black"
                        : "bg-zinc-700 text-white"
                    } ${
                      hasSelectedDocs ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      if (!hasSelectedDocs) setPaymentTypeUI("pago_anticipado");
                    }}
                    disabled={hasSelectedDocs}
                    title={
                      hasSelectedDocs
                        ? "Con comprobantes seleccionados solo se permite Cuenta corriente"
                        : "Pago anticipado"
                    }
                  >
                    Pago anticipado
                  </button>
                </div>

                {/* Botón para PAGAR TOTAL (descuento aplicado al comprobante) */}
                <button
                  className="mt-1 px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
                  onClick={() => {
                    const method: PaymentMethod = "efectivo";
                    const amount = round2(totalDocsFinal);

                    const base: ValueItem = {
                      amount: amount.toString(),
                      selectedReason: PAY_TOTAL_REASON,
                      method,
                    };

                    setPayTotalDocMode(true); // 👈 activamos modo total por doc

                    setNewValues((prev) => {
                      const idx = prev.findIndex(
                        (v) => v.selectedReason === base.selectedReason
                      );
                      if (idx >= 0) {
                        const clone = [...prev];
                        clone[idx] = base;
                        return clone;
                      }
                      return [base, ...prev];
                    });
                  }}
                  disabled={computedDiscounts.length === 0}
                >
                  Pagar total
                </button>
                {newValues.length > 0 ? (
                  <button
                    className="mx-4 mt-1 px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                    onClick={() => {
                      if (hasInvoiceToday) {
                        alert(
                          "No se puede refinanciar saldo cuando hay una factura de hoy."
                        );
                        return;
                      }
                      openCreateModal();
                    }}
                    disabled={computedDiscounts.length === 0 || hasInvoiceToday}
                    title={
                      hasInvoiceToday
                        ? "No disponible: hay una factura de hoy"
                        : "Armar plan en 30/60/90 con cheques iguales"
                    }
                  >
                    {openModalRefi ? "Cerrar refinanciación" : "Refi. Saldo"}
                  </button>
                ) : (
                  <button
                    className="mx-4 mt-1 px-3 py-2 rounded bg-red-600 text-white disabled:opacity-60"
                    onClick={() => {
                      if (hasInvoiceToday) {
                        alert(
                          "No se puede refinanciar saldo cuando hay una factura de hoy."
                        );
                        return;
                      }
                      setShowRefi((s) => !s);
                    }}
                    disabled={computedDiscounts.length === 0 || hasInvoiceToday}
                    title={
                      hasInvoiceToday
                        ? "No disponible: hay una factura de hoy"
                        : "Armar plan en 30/60/90 con cheques iguales"
                    }
                  >
                    {showRefi ? "Cerrar refinanciación" : "Refinanciar"}
                  </button>
                )}

                {showRefi && (
                  <div className="mt-4 rounded-lg border border-zinc-800 p-4 bg-zinc-900/50 space-y-3">
                    <div className="text-sm text-zinc-300">
                      Saldo a refinanciar:{" "}
                      <b>{currencyFmt.format(remainingToRefi)}</b>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
                        onClick={() => proposeChequesPreset([30])}
                      >
                        1 cheque (30 días)
                      </button>
                      <button
                        className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
                        onClick={() => proposeChequesPreset([30, 60])}
                      >
                        2 cheques (30/60)
                      </button>
                      <button
                        className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
                        onClick={() => proposeChequesPreset([30, 60, 90])}
                      >
                        3 cheques (30/60/90)
                      </button>

                      <button
                        className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
                        onClick={() => proposeChequesPreset([30, 60, 90, 120])}
                      >
                        4 cheques (30/60/90/120)
                      </button>
                      <button
                        className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
                        onClick={() =>
                          proposeChequesPreset([30, 60, 90, 120, 150])
                        }
                      >
                        5 cheques (30/60/90/120/150)
                      </button>
                      <button
                        className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
                        onClick={() =>
                          proposeChequesPreset([30, 60, 90, 120, 150, 180])
                        }
                      >
                        6 cheques (30/60/90/120/150/180)
                      </button>
                    </div>

                    <p className="text-xs text-zinc-400">
                      Cada cheque se calcula para que el <i>neto imputable</i>{" "}
                      total coincida con el saldo a refinanciar. Se respeta la
                      tasa anual y los días de gracia configurados.
                    </p>
                  </div>
                )}

                {/* Valores manuales */}
                <ValueView
                  newValues={newValues}
                  setNewValues={setNewValues}
                  annualInterestPct={annualInterestPct}
                  netToPay={round2(totalDocsFinal)}
                  gross={totalBase}
                  docAdjustmentSigned={
                    showSobrePago
                      ? docAdjustmentSigned < 0
                        ? -totalAdjustmentSigned // recargo → negativo
                        : hasRefiValues
                        ? 0
                        : -totalAdjustmentSigned // descuento → 0 si refi, si no positivo
                      : docAdjustmentSigned
                  }
                  onValidityChange={setIsValuesValid}
                  chequeGraceDays={
                    blockChequeInterest
                      ? 100000 // 👈 fuerza días_cobrados = 0 en la UI
                      : checkGrace?.value
                      ? checkGrace.value
                      : 10
                  }
                  docsDaysMin={docsDaysMin}
                  receiptDate={receiptDateRef.current}
                  blockChequeInterest={blockChequeInterest}
                />
              </div>
            )}

            {activeTab === "comments" && (
              <div className="text-white">
                <CommentsView comments={comments} setComments={setComments} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 mt-auto border-t border-zinc-800">
          <button
            onClick={() => {
              if (!canSend) {
                alert(
                  newValues.length === 0
                    ? "Agregá al menos un pago (valor) para confirmar."
                    : "Completá los datos requeridos del/los valores."
                );
                return;
              }
              setIsConfirmModalOpen(true);
            }}
            disabled={!canSend}
            className={`w-full bg-blue-500 text-white py-3 rounded-md font-medium ${
              !canSend ? "opacity-60 cursor-not-allowed" : ""
            }`}
            title={
              !canSend
                ? newValues.length === 0
                  ? "Agregá al menos un valor"
                  : "Faltan datos válidos en los valores"
                : undefined
            }
          >
            {t("paymentModal.send")}
          </button>
        </div>
      </div>

      {/* Confirm Modal (sin cambios funcionales) */}
      {isConfirmModalOpen && (
        <ConfirmDialog
          open={isConfirmModalOpen}
          onCancel={() => setIsConfirmModalOpen(false)}
          onConfirm={handleCreatePayment}
          isLoading={isCreating || isSubmittingPayment}
          canConfirm={canSend} // 👈 ahora exige valores + validez
          invalidReason={
            newValues.length === 0
              ? "Agregá al menos un pago (valor)."
              : "Completá el banco para cheque/transferencia"
          }
          title="Confirmar envío"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            ¿Querés confirmar la creación del pago?
          </p>
        </ConfirmDialog>
      )}

      {openModalRefi && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ModalCalculator
            open={openModalRefi}
            onCancel={closeCreateModal}
            grace={grace}
            interestSetting={interestSetting}
            newValues={newValues}
            setNewValues={setNewValues}
            docsDaysMin={docsDaysMin}
            docSurchargePending={docSurchargePending}
            remainingToRefi={remainingToRefiWithSurchage}
            blockChequeInterest={blockChequeInterest}
          />
        </div>
      )}
    </div>
  );
}

interface InfoRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  valueClassName?: string;
}

function InfoRow({
  label,
  value,
  valueClassName = "text-white",
}: InfoRowProps) {
  return (
    <div className="p-4 flex justify-between items-center border-b border-zinc-800">
      <span className="text-zinc-400">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

type ModalCalculatorProps = {
  open: boolean;
  onCancel: () => void;
  grace?: number | null;
  interestSetting?: { value?: number | null } | null;
  /** opcional: contenedor para el portal (útil si tu app ya tiene un #modal-root) */
  portalContainer?: Element | null;
  newValues: ValueItem[];
  setNewValues: React.Dispatch<React.SetStateAction<ValueItem[]>>;
  docsDaysMin?: number;
  docSurchargePending?: number;
  remainingToRefi?: number;
   blockChequeInterest?: boolean
};

function ModalCalculator({
  open,
  onCancel,
  grace,
  interestSetting,
  portalContainer,
  newValues,
  setNewValues,
  docsDaysMin,
  docSurchargePending,
  remainingToRefi,
   blockChequeInterest=false
}: ModalCalculatorProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const prevLen = useRef<number>(newValues?.length ?? 0);

  // Montaje para evitar SSR mismatches
  useEffect(() => setMounted(true), []);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  useEffect(() => {
    const len = newValues?.length ?? 0;
    if (prevLen.current !== len) {
      prevLen.current = len;
      onCancel();
    }
  }, [newValues?.length, onCancel]);
  if (!open || !mounted) return null;

  const container = portalContainer ?? document.body;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop: cierra solo si el click fue exactamente en el backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onCancel();
        }}
      />

      {/* Dialog: bloquea la propagación para no cerrar al clickear adentro */}
      <div
        ref={dialogRef}
        className="relative z-[101] w-full max-w-3xl mx-4 rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl outline-none ring-1 ring-black/5 "
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/10 dark:border-white/10">
          <h2 className="text-lg font-semibold">Cálculo de pagos a plazo</h2>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-xl px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <PlanCalculator
            title="Cálculo de pagos a plazo"
            // graceDays={grace ?? undefined}
            annualInterestPct={Number(interestSetting?.value) || 96}
            // copy={true}
            newValues={newValues}
            setNewValues={setNewValues}
            // docsDaysMin={docsDaysMin}
            initialTotal={remainingToRefi}
            blockChequeInterest={blockChequeInterest}
          />
        </div>
      </div>
    </div>,
    container
  );
}

function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  isLoading,
  canConfirm = true, // 👈 NUEVO
  invalidReason, // 👈 NUEVO (opcional)
  title,
  children,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  canConfirm?: boolean;
  invalidReason?: string;
  title: string;
  children?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  const disabled = isLoading || !canConfirm;

  const handleConfirmClick = () => {
    if (disabled) return; // 👈 hard stop
    onConfirm();
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div
        className="relative w-full max-w-lg rounded-xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h4 id="confirm-title" className="text-lg font-semibold">
            {title}
          </h4>
        </div>

        <div className="p-4 space-y-3">
          {children}
          {!canConfirm && !!invalidReason && (
            <div className="text-sm text-red-500 mt-1">{invalidReason}</div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={disabled}
            aria-disabled={disabled}
            className={`px-3 py-2 rounded text-white
              ${
                disabled
                  ? "bg-zinc-500 cursor-not-allowed"
                  : isLoading
                  ? "bg-amber-500 cursor-wait"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            title={
              !canConfirm && !isLoading
                ? invalidReason || "Completar campos requeridos"
                : undefined
            }
          >
            {isLoading ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
/** Tooltip simple, accesible y sin dependencias */
function Tip({
  text,
  children,
  side = "top",
}: {
  text: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const pos =
    side === "top"
      ? "bottom-full mb-1 left-1/2 -translate-x-1/2"
      : side === "bottom"
      ? "top-full mt-1 left-1/2 -translate-x-1/2"
      : side === "left"
      ? "right-full mr-1 top-1/2 -translate-y-1/2"
      : "left-full ml-1 top-1/2 -translate-y-1/2";

  return (
    <span
      className="relative inline-flex items-center gap-1 group"
      role="tooltip"
      title={text}
    >
      {children}
      <span
        className={`pointer-events-none absolute ${pos} z-10 max-w-[18rem] rounded-md border border-zinc-700
        bg-zinc-900 px-2 py-1 text-xs text-zinc-200 opacity-0 shadow-lg
        transition-opacity duration-150 group-hover:opacity-100`}
      >
        {text}
      </span>
    </span>
  );
}

/** Etiqueta con ícono + tooltip */
function LabelWithTip({ label, tip }: { label: string; tip: string }) {
  return (
    <Tip text={tip}>
      <span className="inline-flex items-center gap-1">
        <span>{label}</span>
        <InfoIcon className="w-3.5 h-3.5 text-zinc-400" />
      </span>
    </Tip>
  );
}
