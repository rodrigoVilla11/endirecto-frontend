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
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
  const [addNotificationToCustomer] = useAddNotificationToCustomerMutation();
  const [addNotificationToUserById] = useAddNotificationToUserByIdMutation();
  const [graceDiscount, setGraceDiscount] = useState<Record<string, boolean>>(
    {}
  );
  const [isValuesValid, setIsValuesValid] = useState(true);
  const { data: checkGrace } = useGetChequeGraceDaysQuery();
  const { data: documentsGrace } = useGetDocumentsGraceDaysQuery();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingValueRef = useRef<ValueItem | null>(null);

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
    rawAmount?: string;
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
    const raw = parseFloat(v.rawAmount ?? v.amount ?? "0") || 0; // monto ORIGINAL
    const days_total = daysBetweenToday(v.chequeDate);
    const days_charged = Math.max(
      0,
      days_total - (checkGrace?.value ? checkGrace?.value : 45)
    );
    const daily = annualInterestPct / 100 / 365;
    const interest_pct = daily * days_charged; // proporción (0.1427 = 14.27%)
    const interest_amount = +(raw * interest_pct).toFixed(2);
    const net_amount = +(raw - interest_amount).toFixed(2); // lo que se imputa
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
          discount_amount: round2(d.signedAdjustment),
          final_amount: round2(d.finalAmount),
          note: d.note || undefined,
        })),

        values: valuesPayload,
      } as any;
      const created = await createPayment(payload).unwrap();

      const valuesSummary = (created.values ?? [])
        .map((v: any) => {
          const concept = (v?.concept || v?.method || "—").toString();
          const amount = Number(v?.amount ?? 0);
          return `${concept}: ${currencyFmt.format(amount)}`;
        })
        .join(" • ");

      await addNotificationToCustomer({
        customerId: String(selectedClientId),
        notification: {
          title: "PAGO REGISTRADO",
          type: "PAGO",
          description: `${valuesSummary} | Neto: ${currencyFmt.format(
            created?.totals?.net ?? totalToPayWithValuesAdj
          )}`,
          link: "/payments",
          schedule_from: new Date(),
          schedule_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }).unwrap();
      try {
        const now = new Date();
        const in7d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await addNotificationToUserById({
          id: "67a60be545b75a39f99a485b", // _id del user
          notification: {
            title: "Pago registrado",
            type: "PAGO", // si tu backend aún no soporta 'PAGO', usar "NOVEDAD"
            description: `Cliente ${selectedClientId} - ${
              customer?.name
            }  — Neto ${currencyFmt.format(totalToPayWithValuesAdj)}`,
            link: "/payments",
            schedule_from: now,
            schedule_to: in7d,
            customer_id: String(selectedClientId),
          },
        }).unwrap();
      } catch (err) {
        console.warn(
          "Pago creado, pero falló la notificación al usuario:",
          err
        );
      }
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
    const totalValues = values.reduce(
      (a, v) => a + parseFloat(v.amount || "0"),
      0
    );
    if (totalValues <= 0 || docs.length === 0) return 0;

    let totalAdj = 0;

    for (const d of docs) {
      // aplica la tasa de CADA documento sobre el total de pagos
      totalAdj += totalValues * d.rate;
    }

    return round2(totalAdj);
  }

  // 2) AJUSTE TOTAL aplicado sobre VALORES
  const totalAdjustmentSigned = computeAdjustmentOnValuesFull(
    newValues,
    computedDiscounts
  );

  const totalToPayWithValuesAdj = round2(totalBase - totalAdjustmentSigned);

  // (UI)
  const formattedTotalGross = currencyFmt.format(totalBase);
  const formattedDtoRec = `${
    totalAdjustmentSigned >= 0 ? "-" : "+"
  }${currencyFmt.format(Math.abs(totalAdjustmentSigned))}`; // "DTO/REC s/VAL"
  const formattedTotalValues = currencyFmt.format(totalValues);

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

  // Si el valor generado por "Pagar total" cambia de monto,
  // cambiamos también su concepto a "Sin Concepto" y salimos del modo.
  useEffect(() => {
    // buscamos el item creado por "Pagar total"
    const idx = newValues.findIndex(
      (v) => v.selectedReason === PAY_TOTAL_REASON
    );
    if (idx === -1) return;

    const current = newValues[idx];
    const amountNum = round2(parseFloat(current.amount || "0"));
    const docsFinal = round2(totalDocsFinal);

    // Si el monto ya no coincide con el total final por comprobantes,
    // desactivamos el modo y renombramos el concepto.
    if (Math.abs(amountNum - docsFinal) > 0.01) {
      setPayTotalDocMode(false);
      setNewValues((prev) => {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], selectedReason: NO_REASON };
        return clone;
      });
    }
  }, [newValues, totalDocsFinal]);

  // Neto modelo “dto sobre valores”
  const net_by_values = round2(totalBase - totalAdjustmentSigned);

  // Neto a mostrar: si es “pagar total”, usamos el final por comprobante
  const totalNetForUI = payTotalDocMode
    ? round2(totalDocsFinal)
    : net_by_values;

  // Diferencia coherente con el neto mostrado
  const diff = round2(totalNetForUI - totalValues);

  // Formateos para UI
  const formattedDiff = currencyFmt.format(diff);
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
            <InfoRow label="Importe bruto" value={formattedTotalGross} />
            <InfoRow label="Pagos" value={formattedTotalValues} />

            {/* 🆕 DTO/REC con signo (descuento = -, recargo = +) */}
            <InfoRow
              label={
                <LabelWithTip
                  label="DTO/REC s/FACT"
                  tip="Se debe agregar un pago para visualizar el descuento o recargo."
                />
              }
              value={formattedDtoRec}
              valueClassName={
                totalAdjustmentSigned >= 0 ? "text-emerald-400" : "text-red-400"
              }
            />

            {/* Valores y Diferencia (igual que antes) */}
            <InfoRow
              label="Saldo"
              value={formattedDiff}
              valueClassName={
                diff === 0
                  ? "text-emerald-500"
                  : diff > 0
                  ? "text-amber-400"
                  : "text-red-500"
              }
            />
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
                        interestSetting?.value ? interestSetting.value : 96
                      }
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

                {/* Tabla de desglose */}
                {computedDiscounts.length > 0 && (
                  <div className="space-y-3">
                    {computedDiscounts.map((d) => {
                      const src = newPayment.find(
                        (p) => p.document_id === d.document_id
                      );
                      const exp = Number(src?.days_until_expiration);
                      const todayDays = Number(
                        src?.days_until_expiration_today
                      );
                      const daysColor =
                        Number.isFinite(exp) && Number.isFinite(todayDays)
                          ? todayDays > exp
                            ? "text-red-500"
                            : "text-green-500"
                          : "";
                      return (
                        <div
                          key={d.document_id}
                          className="border border-zinc-700 rounded overflow-hidden"
                          title={d.note || ""}
                        >
                          <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-700">
                            Detalle de comprobante
                          </div>

                          <div className="divide-y divide-zinc-800 text-sm text-white">
                            <div className="flex justify-between px-3 py-2">
                              <span className="text-zinc-400">Factura</span>
                              <span
                                className="truncate min-w-0"
                                title={d.number}
                              >
                                {d.number}
                              </span>
                            </div>

                            {/* 10% manual para 30–37 días */}
                            {d.eligibleManual10 && (
                              <label
                                className="flex items-center justify-between px-3 py-2 text-sm border-t border-zinc-800"
                                title="Aplica 10% si está entre 31 y 37 días, solo en Cta Cte, y sin condición que bloquee descuento."
                              >
                                <span className="inline-flex items-center gap-2">
                                  <span className="text-zinc-300">
                                    Aplicar 10% (30–37 días)
                                  </span>
                                  <span className="text-[11px] text-zinc-500">
                                    {d.manualTenApplied ? "Activo" : "Opcional"}
                                  </span>
                                </span>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-emerald-600"
                                  checked={!!graceDiscount[d.document_id]}
                                  onChange={(e) =>
                                    setGraceDiscount((prev) => ({
                                      ...prev,
                                      [d.document_id]: e.target.checked,
                                    }))
                                  }
                                />
                              </label>
                            )}

                            {/* Final */}
                            <div className="flex justify-between px-3 py-2">
                              <span className="text-zinc-400">Final</span>
                              <span
                                className={`tabular-nums ${
                                  d.note ? "text-yellow-400" : ""
                                }`}
                              >
                                {currencyFmt.format(d.finalAmount)}
                              </span>
                            </div>

                            {d.note && (
                              <div className="flex items-center justify-between">
                                <div className="px-3 py-2 text-xs text-yellow-400">
                                  {d.note}
                                </div>
                                <span className="tabular-nums px-4">
                                  {Number.isFinite(exp) ? (
                                    <>
                                      {/* Días: {" "} */}
                                      <span className={daysColor}>
                                        {exp}
                                      </span>{" "}
                                      <span>
                                        (
                                        {Number.isFinite(todayDays)
                                          ? todayDays
                                          : "N/A"}
                                        )
                                      </span>
                                    </>
                                  ) : (
                                    "—"
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

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

                {/* Valores manuales */}
                <ValueView
                  newValues={newValues}
                  setNewValues={setNewValues}
                  annualInterestPct={annualInterestPct}
                  // 👉 usar el neto que realmente mostrás en la UI
                  netToPay={totalNetForUI}
                  // (opcional) alinear el ajuste mostrado con el modo activo:
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
