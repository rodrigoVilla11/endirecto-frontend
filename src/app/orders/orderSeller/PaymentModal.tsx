"use client";

import { useState, useEffect, useRef } from "react";
import { DocumentsView } from "./DocumentsView";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerInformationByCustomerIdQuery } from "@/redux/services/customersInformations";
import ValueView from "./ValueView";
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

  function computeChequeMeta(v: ValueItem) {
    const raw = parseFloat(v.raw_amount ?? v.amount ?? "0") || 0;
    const days_total = daysBetweenToday(v.chequeDate);

    // Usa 1 sola fuente de gracia en todos lados
    const grace = checkGrace?.value ?? 45;

    const days_charged = Math.max(0, days_total - grace);

    // Normalizá SIEMPRE la anual (admite 0.96 o 96)
    const annualNorm = normalizeAnnualPct(annualInterestPct); // % anual
    const daily = annualNorm / 100 / 365;

    const interest_pct = daily * days_charged;
    const interest_amount = round2(raw * interest_pct);
    const net_amount = round2(raw - interest_amount);

    return {
      raw,
      days_total,
      days_charged,
      daily,
      interest_pct,
      interest_amount,
      net_amount,
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
      v === "según pliego" || // por si viene con tilde
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
    // ej: const { user } = useAuth(); return user?.id;
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
    manualTenPct = false
  ) => {
    if (blockedNoDiscount) return `${paymentTypeUI}:cond_pago_sin_descuento`;

    if (paymentTypeUI === "pago_anticipado") {
      return "pago_anticipado:sin_regla";
    }

    // 👇 nueva marca si se activó checkbox 30–37 días
    if (manualTenPct) return "cta_cte:30-37d:10%:manual";

    if (isNaN(days)) return "cta_cte:invalido";
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

  const fmtARS = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(n);

  const absPct = (x: number) => `${(Math.abs(x) * 100).toFixed(1)}%`;

  /** Promedio ponderado de días por DOCUMENTO (pesa por base de cada doc) */
  function weightedDaysByDocs(docs: Array<{ base: number; days: number }>) {
    let w = 0,
      sum = 0;
    for (const d of docs) {
      const b = Number(d.base) || 0;
      const days = Number.isFinite(d.days) ? Number(d.days) : 0;
      w += b * Math.max(0, days);
      sum += b;
    }
    return sum > 0 ? Math.round(w / sum) : 0;
  }

  /** Promedio ponderado de días por VALORES (cheques pesan por neto imputable; otros métodos = 0 días) */
  function weightedDaysByValues(
    values: Array<{ method: string; amount: string; chequeDate?: string }>,
    graceDays: number
  ) {
    // helper local
    const daysBetweenToday = (iso?: string) => {
      if (!iso) return 0;
      const d = new Date(iso);
      const today = new Date();
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).getTime();
      const end = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      ).getTime();
      const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return Math.max(diff, 0);
    };

    let w = 0,
      sum = 0;
    for (const v of values) {
      const net = parseFloat(v.amount || "0") || 0;
      const daysTotal =
        v.method === "cheque" ? daysBetweenToday(v.chequeDate) : 0;
      const charged = Math.max(0, daysTotal - (graceDays ?? 0));
      w += net * charged;
      sum += net;
    }
    return sum > 0 ? Math.round(w / sum) : 0;
  }

  /** Lista legible de la composición del pago (con fechas para cheques) */
  /** Lista legible de la composición del pago (con fechas para cheques)
   * - Cheques: "Cheque dd/mm/yy — Nominal: $X • Actual: $Y"
   * - Otros:   "Efectivo/Transferencia: $X"
   */
  function prettyValuesBreakdown(
    values: Array<{
      method: string;
      amount: string;
      chequeDate?: string;
      raw_amount?: string;
    }>
  ) {
    const lines: string[] = [];
    for (const v of values) {
      const net = fmtARS(Number(v.amount || 0)); // Actual (NETO imputable)
      if (v.method === "cheque") {
        const nominal = fmtARS(Number(v.raw_amount || v.amount || 0)); // Nominal (BRUTO)
        const d = v.chequeDate ? new Date(v.chequeDate) : null;
        const dd = d
          ? d.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })
          : "—";
        lines.push(`Cheque ${dd} — Nominal: ${nominal} • Actual: ${net}`);
      } else if (v.method === "efectivo") {
        lines.push(`Efectivo: ${net}`);
      } else if (v.method === "transferencia") {
        lines.push(`Transferencia: ${net}`);
      } else {
        lines.push(`${v.method || "Otro"}: ${net}`);
      }
    }
    return lines.length ? lines.join("\n") : "—";
  }
  const fmtMoney2 = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.round((n + Number.EPSILON) * 100) / 100);

  const fmtPct1 = (f: number) => `${(Math.abs(f) * 100).toFixed(1)}%`;
  const ddmmyy = (d: Date) =>
    d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  /** Construye el texto multilinea de la notificación */
  function buildPaymentNotificationText(opts: {
    date: Date;
    id: string;
    customerCode?: string | number;
    customerName?: string;
    sellerIdOrName?: string | number;
    userName?: string;

    // DOCUMENTOS
    docsBase: number; // Σ base_i
    docsFinal: number; // Σ final_i
    docsDaysAvg: number;
    docsAdjAmount: number; // = docsFinal - docsBase  (>0 recargo, <0 descuento)

    // VALORES
    values: Array<{
      method: string; // "efectivo" | "transferencia" | "cheque"
      amount: string; // neto imputable (cheque = net_amount)
      chequeDate?: string; // YYYY-MM-DD
      raw_amount?: string; // nominal (solo cheques)
      chequeNumber?: string;
      selectedReason?: string;
    }>;

    // Parámetros
    docsAdjRate: number; // = docsAdjAmount / docsBase
    annualInterestPct: number;
    chequeGraceDays: number;
    valuesTotal: number; // suma neta de valores imputables (cheques ya neto)
  }) {
    const {
      date,
      id,
      customerCode,
      customerName,
      sellerIdOrName,
      userName,
      docsBase,
      docsFinal,
      docsDaysAvg,
      docsAdjAmount, // >0 recargo, <0 descuento
      values,
      docsAdjRate,
      annualInterestPct,
      chequeGraceDays,
      valuesTotal,
    } = opts;

    // ===== Helpers (usas tus helpers reales en runtime)
    const asNum = (x: any) => Number(x ?? 0);
    const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

    // ===== Rows
    type Row = {
      idx: number;
      method: string;
      label: string;
      baseForAdj: number; // base para prorrateo del ajuste (efec/transf = neto; cheque = nominal)
      baseShown: number; // lo que se muestra en "Composición" (efec/transf neto; cheque nominal)
      net: number; // neto imputable (amount)
      raw?: number; // nominal (cheque)
      chequeDate?: string;
      chequeNumber?: string;
    };

    const rows: Row[] = (values || []).map((v, idx) => {
      const m = (v.method || "").toLowerCase();
      const isCheque = m === "cheque";
      const net = asNum(v.amount);
      const raw = isCheque ? asNum(v.raw_amount ?? v.amount) : net;

      const label =
        m === "efectivo"
          ? "Efectivo"
          : m === "transferencia"
          ? "Transferencia"
          : isCheque
          ? "Cheque"
          : "Otro";

      return {
        idx,
        method: m,
        label,
        baseForAdj: isCheque ? raw : net, // prorrateo por nominal para cheques
        baseShown: isCheque ? raw : net, // lo que se imprime en composición
        net,
        raw: isCheque ? raw : undefined,
        chequeDate: v.chequeDate,
        chequeNumber: v.chequeNumber,
      };
    });

    // Sumas base
    const totalBaseForAdj = rows.reduce((s, r) => s + r.baseForAdj, 0);
    const totalBaseShown = rows.reduce((s, r) => s + r.baseShown, 0); // = Total Pagado (bases)

    // Ratio de pago real sobre la factura (por neto que entra a factura)
    const totalNetActual = rows.reduce((s, r) => s + r.net, 0);
    const paidRatio =
      docsFinal > 0 ? Math.min(1, totalBaseForAdj / docsFinal) : 0;

    // Ajuste documentos aplicado (proporcional a baseForAdj)
    const docAdjAppliedTotal = round2(docsAdjAmount * paidRatio);
    let distributed = 0;
    const docAdjPerRow = rows.map((r, i) => {
      if (totalBaseForAdj === 0) return 0;
      const isLast = i === rows.length - 1;
      let part = round2((docAdjAppliedTotal * r.baseForAdj) / totalBaseForAdj);
      if (isLast) part = round2(docAdjAppliedTotal - distributed); // corrección
      distributed = round2(distributed + part);
      return part;
    });

    // Costo financiero propio de cheques
    let totalCostoCheques = 0;

    // ===== Composición
    const lines: string[] = [];
    const docsPctTxt =
      (docsAdjRate >= 0 ? "+" : "-") +
      (Math.abs(docsAdjRate) * 100).toFixed(1) +
      "%";

    rows.forEach((r, i) => {
      const adj = docAdjPerRow[i];

      if (r.method !== "cheque") {
        // Efectivo / Transferencia
        lines.push(`${r.label}: ${fmtMoney2(r.baseShown)}`);
        lines.push(
          `Desc/Cost F: ${docsDaysAvg} días - ${fmtPct1(docsAdjRate)}`
        );
        lines.push(`Desc/Cost F: ${fmtMoney2(adj)}`);
        lines.push(`--------------------------------`);
        return;
      }

      // Cheque: mostrar solo "Cheque DD/MM/YY: $ {nominal}"
      const when = r.chequeDate ? ddmmyy(new Date(r.chequeDate)) : "—";

      // Calcular meta del cheque para intereses
      const meta = computeChequeMeta({
        method: "cheque",
        selectedReason: r.chequeNumber || "",
        amount: String(r.net), // neto (actual)
        raw_amount: String(r.raw ?? r.net), // nominal
        chequeDate: r.chequeDate,
        bank: undefined,
      });

      totalCostoCheques += asNum(meta.interest_amount);

      lines.push(`Cheque ${when}: ${fmtMoney2(r.baseShown)}`);
      lines.push(`Desc/Cost F: ${docsDaysAvg} días - ${fmtPct1(docsAdjRate)}`);
      lines.push(`Desc/Cost F: ${fmtMoney2(adj)}`);
      lines.push(
        `Costo Financiero: ${meta.days_charged} días - ${fmtPct1(
          meta.interest_pct
        )}`
      );
      lines.push(`Costo Financiero: ${fmtMoney2(meta.interest_amount)}`);
      lines.push(`--------------------------------`);
    });

    // ===== Header
    const fecha = ddmmyy(date);
    const cliente = `${(customerCode ?? "—").toString().padStart(5, "0")} - ${
      customerName || ""
    }`.trim();
    // ===== Totales (exactamente como tu layout, con ajuste de redondeo)
    const totalPagado = round2(totalBaseShown); // suma de bases (cheques NOMINAL, otros = neto)
    const totalDescCost = round2(docAdjAppliedTotal + totalCostoCheques);

    // Neto inicial (antes del ajuste): Total Pagado - Total Desc/Cost F
    const netoInicial = round2(totalPagado - totalDescCost);

    // Queremos: Neto == Documentos (docsBase)
    const deltaToMatch = round2(docsBase - netoInicial);

    // Si hay diferencia por centavos, la absorbemos como "Ajuste por redondeo"
    // Nota: sumar al total de desc/costo hace que TP - (TDC + ajuste) == docsBase
    const needsAdjust = Math.abs(deltaToMatch) >= 0.01;
    const ajusteRedondeo = needsAdjust ? -deltaToMatch : 0;

    // Totales finales con ajuste aplicado
    const totalDescCostFinal = round2(totalDescCost + ajusteRedondeo);
    const netoFinal = round2(totalPagado - totalDescCostFinal); // == docsBase

    // SALDO: partimos del saldo coherente por valores netos y lo ajustamos
    // Saldo inicial = docsFinal - (suma neta que entra a factura)
    const saldoInicial = round2(docsFinal - totalNetActual);

    // Si sube el neto aplicado, baja el saldo (y viceversa)
    const saldoFinal = round2(saldoInicial - (netoFinal - netoInicial));

    // ===== Render del texto (idéntico a tu layout)
    return [
      `Fecha: ${fecha}`,
      `ID Pago: ${id}`,
      `Cliente: ${cliente}`,
      `Vendedor: ${sellerIdOrName ?? "—"}`,
      `Usuario: ${userName || "—"}`,
      ``,
      `Documentos: ${fmtMoney2(docsBase)}`,
      `Desc/Costo Financiero: ${docsDaysAvg} días - ${fmtPct1(docsAdjRate)}`,
      `Desc/Costo Financiero: ${fmtMoney2(Math.abs(docsAdjAmount))}`,
      `-----------------------------------`,
      `TOTAL A PAGAR (efect/transf): ${fmtMoney2(docsFinal)}`,
      ``,
      ``,
      `COMPOSICION DEL PAGO:`,
      ...lines,
      `--------------------------------`,
      `Total Pagado: ${fmtMoney2(totalPagado)}`,
      `Desc/Cost F: ${fmtMoney2(docAdjAppliedTotal)}`,
      `Cost F. Cheques: ${fmtMoney2(totalCostoCheques)}`,
      ...(needsAdjust
        ? [`Ajuste por redondeo: ${fmtMoney2(ajusteRedondeo)}`]
        : []),
      `Total Desc/Cost F: ${fmtMoney2(totalDescCostFinal)}`,
      `--------------------------------`,
      `Neto a aplicar Factura: ${fmtMoney2(netoFinal)}`, // ahora igual a "Documentos"
      `SALDO ${fmtARS(saldoFinal)}`,
    ].join("\n");
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

      // dentro de handleCreatePayment, donde armás valuesPayload:
      const valuesPayload = newValues.map((v) => {
        const amountNet = round2(parseFloat(v.amount || "0"));

        const common = {
          // 👇 OJO: para cheques vamos a sobre-escribir amount más abajo
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

        // 👉 CHEQUE: el amount del payload debe ser el neto calculado
        const m = computeChequeMeta(v);
        chequeInterestTotal += m.interest_amount;
        valuesRawTotal += m.raw;

        return {
          ...common,
          amount: round2(m.net_amount), // ⬅️ clave: forzamos que amount = net_amount
          raw_amount: round2(m.raw),
          cheque: {
            collection_date: v.chequeDate || null,
            days_total: m.days_total,
            grace_days: checkGrace?.value,
            days_charged: m.days_charged,
            annual_interest_pct: annualInterestPct,
            daily_rate: round4(m.daily),
            interest_pct: round4(m.interest_pct),
            interest_amount: round2(m.interest_amount),
            net_amount: round2(m.net_amount), // coincide con amount
            cheque_number: v.chequeNumber || undefined,
          },
        };
      });

      // ——— Totales generales (incluyendo extras de valores) ———
      const totals = {
        gross: round2(totalBase), // base por documentos
        // 🔁 ahora el ajuste mostrado es el aplicado a VALORES
        discount: round2(totalAdjustmentSigned), // +desc / -rec aplicado a valores
        net: round2(totalNetForUI), // total a pagar (base - ajuste en valores)
        values: round2(totalValues), // suma de valores imputables (cheque ya neto)
        values_raw: round2(valuesRawTotal), // suma de montos originales (para cheques)
        cheque_interest: round2(chequeInterestTotal), // intereses totales por cheques
        cheque_grace_days: checkGrace?.value,
        interest_annual_pct: annualInterestPct,
        diff: round2(totalNetForUI - totalValues),
      };

      // ——— Payload final ———
      const payload = {
        status: "pending",
        type: paymentTypeUI,
        date: new Date(),
        currency: "ARS",
        comments,
        source: "web",
        customer: { id: String(selectedClientId) },
        user: { id: String(userId) },
        seller: { id: String(userData?.seller_id) },
        payment_condition: { id: getPaymentConditionId() },

        totals,
        total: round4(totalToPayWithValuesAdj),

        documents: computedDiscounts.map((d) => ({
          document_id: d.document_id,
          number: d.number,
          days_used: isNaN(d.days) ? undefined : d.days,
          // 👇 pasa el flag manual para que quede rastreado
          rule_applied: buildRuleApplied(
            d.days,
            d.noDiscountBlocked,
            d.manualTenApplied
          ),
          base: round2(d.base),
          discount_rate: round4(d.rate),
          discount_amount: round2(-d.signedAdjustment),
          final_amount: round2(d.finalAmount),
          note: d.note || undefined,
        })),

        values: valuesPayload,
      } as any;
      const created = await createPayment(payload).unwrap();

      // ===== Datos para armar el texto =====
      const now = new Date();

      const id = created._id || "—";
      const customerCode = customer?.id ?? selectedClientId;
      const customerName = customer?.name ?? "";
      const sellerName = customer?.seller_id; // ajustá al nombre real del vendedor si lo tenés
      const userName = userData?.username || "";

      // DOCUMENTOS: usamos tus totales ya calculados en la UI
      const docsBase = round2(totalBase);
      const docsFinal = round2(totalDocsFinal);

      // Promedio ponderado de días por doc (pesa cada base de doc)
      const docsDaysAvg = weightedDaysByDocs(
        (computedDiscounts || []).map((d) => ({ base: d.base, days: d.days }))
      );

      // VALORES
      const valuesTotal = round2(totalValues);
      const valuesTotalNominal = round2(valuesRawTotal);

      // Ajuste aplicado SOBRE VALORES (el que prorrateás): puede ser + (descuento) o - (recargo)
      const valuesAdjAmount = round2(totalAdjustmentSigned);

      // Promedio ponderado de días por valores (cheques con gracia; otros = 0)
      const grace = checkGrace?.value ?? 45;
      const valuesDaysAvg = weightedDaysByValues(
        (newValues || []).map((v) => ({
          method: v.method,
          amount: v.amount,
          chequeDate: v.chequeDate,
        })),
        grace
      );

      // Composición legible
      const valuesBreakdown = prettyValuesBreakdown(
        (newValues || []).map((v) => ({
          method: v.method,
          amount: v.amount,
          chequeDate: v.chequeDate,
          raw_amount: v.raw_amount,
        }))
      );

      const docsAdjAmount = round2(docsFinal - docsBase); // 👈 ojo: final - base
      const docsAdjRate = docsBase !== 0 ? docsAdjAmount / docsBase : 0;

      const sellerDisplay = customer?.seller_id ?? userData?.seller_id ?? "—";

      // Armamos el texto EXACTO
      const longDescription = buildPaymentNotificationText({
        date: now,
        id,
        customerCode,
        customerName,
        sellerIdOrName: sellerDisplay,
        userName: userData?.username || "",

        docsBase,
        docsFinal,
        docsDaysAvg,
        docsAdjAmount,

        values: (newValues || []).map((v) => ({
          method: v.method,
          amount: v.amount,
          chequeDate: v.chequeDate,
          raw_amount: v.raw_amount, // importante para “Cheque ...: $ raw”
          chequeNumber: v.chequeNumber,
        })),

        docsAdjRate,
        annualInterestPct: annualInterestPct,
        chequeGraceDays: checkGrace?.value ?? 45,
        valuesTotal,
      });

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

      // ===== Notificación al usuario (resumen corto + adjunto el bloque completo abajo) =====
      const shortHeader = `Cliente ${customerCode} - ${customerName}\nNeto ${fmtARS(
        docsFinal
      )} • Pagado ${fmtARS(valuesTotal)} • Saldo ${fmtARS(
        docsFinal - valuesTotal
      )}`;

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

  function getAdjustmentRate(
    days: number,
    type: PaymentType,
    docPaymentCondition?: string,
    forceTenPct: boolean = false // 👈 nuevo
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

  // total base de documentos
  const totalBase = computedDiscounts.reduce((a, d) => a + d.base, 0);

  // total de valores ingresados
  const totalValues = newValues.reduce(
    (total, v) => total + parseFloat(v.amount || "0"),
    0
  );

  // 🔑 Nueva versión: reparte cada valor proporcionalmente entre documentos
  function computeAdjustmentOnValuesFull(values: ValueItem[], docs: any[]) {
    // total pagado (neto imputable)
    const valuesTotal = values.reduce(
      (a, v) => a + parseFloat(v.amount || "0"),
      0
    );
    if (valuesTotal <= 0 || docs.length === 0) return 0;

    // Ajuste por documentos (sobre BASE): Σ base * rate  (+desc / -rec)
    const docAdjustment = docs.reduce(
      (a: number, d: any) => a + (d.base || 0) * (d.rate || 0),
      0
    );

    // Base total de documentos
    const docsBaseTotal = docs.reduce(
      (a: number, d: any) => a + (d.base || 0),
      0
    );
    if (docsBaseTotal <= 0) return 0;

    // 🔑 Tasa global “sobre base” (ej: 0.10 si es 10%)
    const globalRateOnBase = docAdjustment / docsBaseTotal;

    // ✅ Descuento/recargo aplicado sobre lo pagado (no sobre el final)
    //    Con 10% y pago 200.000 => 200.000 * 0.10 = 20.000
    const valuesAdj = Math.round(valuesTotal * globalRateOnBase * 100) / 100;
    return valuesAdj;
  }

  // 2) AJUSTE TOTAL aplicado sobre VALORES
  const totalAdjustmentSigned = computeAdjustmentOnValuesFull(
    newValues,
    computedDiscounts
  );

  const totalToPayWithValuesAdj = round2(totalBase - totalAdjustmentSigned);

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

  function buildPresetSchedule(count: 1 | 2 | 3) {
    if (count === 1)
      return [{ label: "30 días", dateISO: dateISOPlusDays(30) }];
    if (count === 2)
      return [
        { label: "30 días", dateISO: dateISOPlusDays(30) },
        { label: "60 días", dateISO: dateISOPlusDays(60) },
      ];
    return [
      { label: "30 días", dateISO: dateISOPlusDays(30) },
      { label: "60 días", dateISO: dateISOPlusDays(60) },
      { label: "90 días", dateISO: dateISOPlusDays(90) },
    ];
  }

  function mergeRefiCheques(cheques: ValueItem[]) {
    setNewValues((prev) => {
      const keep = prev.filter(
        (v) => !(v.method === "cheque" && v.selectedReason === "Refinanciación")
      );
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
  const net_by_values = round2(totalBase - totalAdjustmentSigned);

  // Ajuste calculado por REGLA DE CADA COMPROBANTE (siempre visible)
  const docAdjustmentSigned = round2(totalBase - totalDocsFinal);
  const hasPartialPayment =
    totalValues > 0 && Math.abs(totalValues - round2(totalDocsFinal)) > 0.01;

  const showSobrePago = !payTotalDocMode && hasPartialPayment;

  // Neto a mostrar: si es “pagar total”, usamos el final por comprobante
  const totalNetForUI = round2(totalDocsFinal);

  // Diferencia coherente con el neto mostrado
  const diff = round2(totalNetForUI - totalValues);

  const remainingToRefi = Math.max(0, diff); // saldo restante (neto mostrado - valores cargados)
  function proposeChequesPreset(daysList: number[]) {
    const targetPV = remainingToRefi; // saldo restante
    if (computedDiscounts.length === 0) {
      alert("No se puede refinanciar sin documentos seleccionados.");
      return;
    }
    if (targetPV <= 0) {
      alert("No hay saldo pendiente para refinanciar.");
      return;
    }

    const grace = checkGrace?.value ?? 45;
    const daily = dailyRateFromAnnual(annualInterestPct);

    // helper: fecha YYYY-MM-DD a partir de hoy + d días
    function isoInDays(d: number) {
      const base = new Date();
      const dt = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate() + d
      );
      return dt.toISOString().slice(0, 10);
    }

    const n = daysList.length;
    const cheques: ValueItem[] = [];
    let accNet = 0;

    daysList.forEach((d, idx) => {
      const daysTotal = d;
      const daysCharged = Math.max(0, daysTotal - grace);
      const interestPct = daily * daysCharged;

      // seguridad por si 1 - i <= 0
      const safeDen = 1 - interestPct <= 0 ? 1 : 1 - interestPct;

      let net: number;
      if (idx === n - 1) {
        // último: ajusta para cerrar exacto
        net = targetPV - accNet;
      } else {
        net = targetPV / n;
      }

      const raw = net / safeDen;
      accNet += net;

      cheques.push({
        method: "cheque",
        selectedReason: "Refinanciación",
        amount: round2(net).toFixed(2), // NETO imputable
        raw_amount: round2(raw).toFixed(2), // NOMINAL (bruto)
        chequeDate: isoInDays(d), // 30/60/90
      });
    });

    // Corrección de redondeo (si hiciera falta)
    const sumNet = cheques.reduce((a, c) => a + parseFloat(c.amount), 0);
    const delta = round2(targetPV - sumNet);
    if (Math.abs(delta) > 0.01) {
      const last = cheques[cheques.length - 1];
      const newNet = round2(parseFloat(last.amount) + delta);

      // recalcular raw del último
      const dLast = daysList[daysList.length - 1];
      const daysCharged = Math.max(0, dLast - grace);
      const interestPct = daily * daysCharged;
      const safeDen = 1 - interestPct <= 0 ? 1 : 1 - interestPct;
      const newRaw = round2(newNet / safeDen);

      last.amount = newNet.toFixed(2);
      last.raw_amount = newRaw.toFixed(2);
    }

    mergeRefiCheques(cheques);
  }

  // Formateos para UI
  const formattedDiff = currencyFmt.format(diff);
  if (!isOpen) return null;

  // arriba del return (en PaymentModal)
  // helper arriba del return
  function formatAdjText(signed: number) {
    const isDiscount = signed >= 0; // + => descuento | - => recargo
    const sign = isDiscount ? "−" : "+"; // mostrar - si es descuento, + si es recargo
    const cls = isDiscount ? "text-emerald-400" : "text-red-400";
    const abs = Math.abs(signed);
    return { text: `${sign}${currencyFmt.format(abs)}`, cls };
  }

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
                    const signed = showSobrePago
                      ? totalAdjustmentSigned ?? 0
                      : docAdjustmentSigned;
                    const { text, cls } = formatAdjText(signed);
                    return <div className={cls}>{text}</div>;
                  })()}
                </div>
              }
            />

            <InfoRow
              label="Total a pagar a la fecha"
              value={currencyFmt.format(totalFinal)}
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
                <button
                  className="mx-4 mt-1 px-3 py-2 rounded bg-red-600 text-white disabled:opacity-60"
                  onClick={() => setShowRefi((s) => !s)}
                  disabled={computedDiscounts.length === 0}
                  title="Armar plan en 30/60/90 con cheques iguales"
                >
                  {showRefi ? "Cerrar refinanciación" : "Refinanciar"}
                </button>

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
                  docAdjustmentSigned={
                    payTotalDocMode
                      ? round2(totalBase - totalDocsFinal) // ajuste efectivo por doc
                      : totalAdjustmentSigned // ajuste “sobre valores”
                  }
                  onValidityChange={setIsValuesValid}
                  chequeGraceDays={checkGrace?.value ? checkGrace.value : 10}
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
