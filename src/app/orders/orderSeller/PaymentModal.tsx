"use client";

import { useState, useEffect, useRef } from "react";
import { DocumentsView } from "./DocumentsView";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerInformationByCustomerIdQuery } from "@/redux/services/customersInformations";
import ValueView from "./ValueView";
import { CommentsView } from "./CommentsView";
import { useTranslation } from "react-i18next";
import {
  CreatePayment,
  PaymentStatus,
  useCreatePaymentMutation,
} from "@/redux/services/paymentsApi";
import { createPortal } from "react-dom";
import { useAuth } from "@/app/context/AuthContext";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentType = "contra_entrega" | "cta_cte";
type ContraEntregaOption = "efectivo_general" | "efectivo_promos" | "cheque_30";

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { t } = useTranslation();
  // 🔁 Valores primero
  const [activeTab, setActiveTab] = useState<
    "documents" | "values" | "comments"
  >("values");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { selectedClientId } = useClient();
  const [comments, setComments] = useState("");
  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();

  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingValueRef = useRef<ValueItem | null>(null);

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

  // Valores ingresados
  type PaymentMethod = "efectivo" | "transferencia" | "cheque";
  type ValueItem = {
    amount: string;
    selectedReason: string;
    method: PaymentMethod;
    bank?: string;
    receipt?: string;
    receiptOriginalName?: string;
  };
  const [newValues, setNewValues] = useState<ValueItem[]>([]);

  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [submittedPayment, setSubmittedPayment] = useState(false);

  const currencyFmt = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // ---- Lógica de descuentos ----
  const [paymentTypeUI, setPaymentTypeUI] =
    useState<PaymentType>("contra_entrega");
  const [contraEntregaOpt, setContraEntregaOpt] =
    useState<ContraEntregaOption>("efectivo_general");
  const [contraEntregaMonto, setContraEntregaMonto] = useState<string>("");

  // ⛔️ Si hay documentos seleccionados, bloquear contra_entrega y forzar cta_cte
  const hasSelectedDocs = newPayment.length > 0;
  useEffect(() => {
    if (hasSelectedDocs && paymentTypeUI === "contra_entrega") {
      setPaymentTypeUI("cta_cte");
    }
  }, [hasSelectedDocs, paymentTypeUI]);

  function daysFromInvoice(dateStr?: string) {
    if (!dateStr) return NaN;
    const d = new Date(dateStr);
    const today = new Date();
    const diffMs = today.getTime() - d.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  function getDocDays(doc: {
    days_until_expiration_today?: any;
    date?: string;
  }) {
    const v = Number(doc.days_until_expiration_today);
    if (Number.isFinite(v)) return v;
    return daysFromInvoice(doc.date);
  }
  const { userData } = useAuth();

  // 👇 Agregar dentro del componente PaymentModal, antes del return
  // const handleCreatePayment = async () => {
  //   if (isCreating || isSubmittingPayment) return;

  //   // 1) Tomar user id (ajustá a tu app)
  //   // Si usás AuthContext: const { user: authUser } = useAuth();
  //   const currentUserId = userData?._id
  //   if (!currentUserId) {
  //     alert(
  //       "No se encontró el usuario logueado (user). Pasá el user.id desde tu AuthContext/Redux."
  //     );
  //     return;
  //   }

  //   // 2) Validaciones mínimas
  //   if (!selectedClientId) {
  //     alert("Falta el cliente (customer).");
  //     return;
  //   }
  //   if (newValues.length === 0) {
  //     alert("Agregá al menos un valor de pago.");
  //     return;
  //   }
  //   // Si hay documentos, exigimos que neto y valores coincidan
  //   if (computedDiscounts.length > 0 && Math.abs(diff) > 0.01) {
  //     alert(
  //       `La diferencia debe ser $0,00 para imputar a comprobantes. Actual: ${formattedDiff}`
  //     );
  //     return;
  //   }

  //   // 3) Helpers para campos que exige el backend
  //   const mapPaymentCondition = () => {
  //     // Ajustá estos strings a tu Enum de backend (ej.: "CUENTA_CORRIENTE" | "CONTRA_ENTREGA")
  //     return paymentTypeUI === "cta_cte"
  //       ? "CUENTA_CORRIENTE"
  //       : "CONTRA_ENTREGA";
  //   };

  //   const mapType = () => {
  //     // Ajustá a tu Enum real (ej.: "COLLECTION" | "PAYMENT" | "INCOME")
  //     return "COLLECTION";
  //   };

  //   const mapStatus = (): PaymentStatus => {
  //     // "CONFIRMED" no es válido en tu esquema.
  //     // Usamos PENDING como valor seguro. Cambiá si tu enum permite "APPROVED" / "COMPLETED" etc.
  //     return "PENDING" as PaymentStatus;
  //   };

  //   const buildRuleApplied = (days: number) => {
  //     if (paymentTypeUI === "contra_entrega") {
  //       if (contraEntregaOpt === "efectivo_general")
  //         return "contra_entrega:efectivo_general:20%";
  //       if (contraEntregaOpt === "efectivo_promos")
  //         return "contra_entrega:efectivo_promos:15%";
  //       if (contraEntregaOpt === "cheque_30") {
  //         return !isNaN(days) && days <= 30
  //           ? "contra_entrega:cheque_<=30d:13%"
  //           : "contra_entrega:cheque_>30d:0%";
  //       }
  //       return "contra_entrega:sin_regla";
  //     } else {
  //       if (isNaN(days)) return "cta_cte:invalido";
  //       if (days <= 15) return "cta_cte:<=15d:13%";
  //       if (days <= 30) return "cta_cte:<=30d:10%";
  //       if (days > 45) return "cta_cte:>45d:actualizacion";
  //       return "cta_cte:0%";
  //     }
  //   };

  //   setIsSubmittingPayment(true);
  //   try {
  //     // 4) Armar payload con los nombres que exige el backend
  //     const payload = {
  //       user: currentUserId, // REQUIRED
  //       customer: selectedClientId, // REQUIRED
  //       type: mapType(), // REQUIRED (ajustá a tu enum real)
  //       status: mapStatus(), // status válido
  //       payment_condition: mapPaymentCondition(), // REQUIRED (ajustá a tu enum)

  //       // total: el backend lo exige; usamos suma de valores (debe igualar neto si hay docs)
  //       total: +totalValues.toFixed(2), // REQUIRED

  //       // opcionales útiles
  //       date: new Date().toISOString(),
  //       comments,

  //       // Valores: el backend exige "concept"
  //       values: newValues.map((v) => ({
  //         amount: +parseFloat(v.amount || "0").toFixed(2),
  //         method: v.method, // si tu backend usa enum tipo "CASH|TRANSFER|CHECK", mapealo acá
  //         concept: v.selectedReason, // 👈 REQUIRED por el backend
  //         bank: v.bank || null,
  //       })),

  //       // Documentos: el backend exige estos nombres
  //       documents: computedDiscounts.map((d) => ({
  //         document_id: d.document_id, // si tu schema pide "document" en vez de "document_id", cambialo
  //         number: d.number,
  //         base_amount: +d.base.toFixed(2), // opcional, pero útil
  //         discount_rate: d.rate, // 👈 REQUIRED
  //         discount_amount: +d.discountAmount.toFixed(2), // 👈 REQUIRED
  //         final_amount: +d.finalAmount.toFixed(2), // 👈 REQUIRED
  //         rule_applied: buildRuleApplied(d.days), // 👈 REQUIRED (string descriptivo de la regla)
  //       })),
  //     } as unknown as CreatePayment;

  //     // 5) Llamada
  //     await createPayment(payload).unwrap();

  //     // 6) Reset UI
  //     setIsConfirmModalOpen(false);
  //     setSubmittedPayment(true);
  //     setNewValues([]);
  //     setNewPayment([]);
  //     setSelectedRows([]);
  //     setComments("");
  //     onClose();
  //   } catch (err) {
  //     console.error("CreatePayment error:", err);
  //     alert(
  //       "No se pudo crear el pago. Revisá los datos (enums y nombres) e intentá nuevamente."
  //     );
  //   } finally {
  //     setIsSubmittingPayment(false);
  //   }
  // };

  // Utils de redondeo (evita flotantes raros en la UI)
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
    paymentTypeUI === "cta_cte" ? "cta_cte" : "contra_entrega";

  // Regla usada (string descriptivo)
  const buildRuleApplied = (days: number) => {
    if (paymentTypeUI === "contra_entrega") {
      if (contraEntregaOpt === "efectivo_general")
        return "contra_entrega:efectivo_general:20%";
      if (contraEntregaOpt === "efectivo_promos")
        return "contra_entrega:efectivo_promos:15%";
      if (contraEntregaOpt === "cheque_30") {
        return !isNaN(days) && days <= 30
          ? "contra_entrega:cheque_<=30d:13%"
          : "contra_entrega:cheque_>30d:0%";
      }
      return "contra_entrega:sin_regla";
    } else {
      if (isNaN(days)) return "cta_cte:invalido";
      if (days <= 15) return "cta_cte:<=15d:13%";
      if (days <= 30) return "cta_cte:<=30d:10%";
      if (days > 45) return "cta_cte:>45d:actualizacion";
      return "cta_cte:0%";
    }
  };

  const handleCreatePayment = async () => {
    if (isCreating || isSubmittingPayment) return;

    const userId = getCurrentUserId();
    if (!userId) return alert("Falta user.id (logueo).");

    if (!selectedClientId) return alert("Falta customer.id.");
    if (newValues.length === 0) return alert("Agregá al menos un valor.");

    // si hay docs, neto y valores deben cerrar
    if (computedDiscounts.length > 0 && Math.abs(diff) > 0.01) {
      return alert(`La diferencia debe ser $0,00. Actual: ${formattedDiff}`);
    }

    setIsSubmittingPayment(true);
    try {
      const totals = {
        gross: round2(totalBase),
        discount: round2(totalDiscount),
        net: round2(totalAfterDiscount),
        values: round2(totalValues),
        diff: round2(diff),
      };

      const payload = {
        // enums en minúscula según tu schema:
        status: "pending", // 'pending' | 'confirmed' | 'reversed'
        type: paymentTypeUI, // 'contra_entrega' | 'cta_cte'
        contra_entrega_choice:
          paymentTypeUI === "contra_entrega" ? contraEntregaOpt : undefined,

        date: new Date(), // el schema espera Date
        currency: "ARS", // default, pero no molesta
        comments,
        source: "web",

        customer: { id: String(selectedClientId) },
        user: { id: String(userId) },
        payment_condition: { id: getPaymentConditionId() },

        totals,

        // el schema dice: "total" (usar NETO). Tiene set toFixed(4)
        total: round4(totalAfterDiscount),

        // Detalle de documentos
        documents: computedDiscounts.map((d) => ({
          document_id: d.document_id,
          number: d.number,
          days_used: isNaN(d.days) ? undefined : d.days,
          rule_applied: buildRuleApplied(d.days),
          base: round2(d.base),
          discount_rate: round4(d.rate), // 0.1300 etc.
          discount_amount: round2(d.discountAmount),
          final_amount: round2(d.finalAmount),
          note: d.note || undefined,
        })),

        // Valores (medios de pago). method debe ser 'efectivo' | 'transferencia' | 'cheque'
        values: newValues.map((v) => ({
          amount: round2(parseFloat(v.amount || "0")),
          concept: v.selectedReason,
          method: v.method,
          bank: v.bank || undefined,
          receipt_url: v.receipt || undefined, // 👈 ahora sí
          receipt_original_name: v.receiptOriginalName || undefined, // 👈 ahora sí
        })),
      } as any; // <- si tu tipo TS frontend no coincide, casteá a any o actualizá el DTO

      // Debug opcional
      console.log("CreatePayment payload", payload);

      await createPayment(payload).unwrap();

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

  function getDiscountRateForDoc(
    docDays: number,
    type: PaymentType,
    contraEntregaChoice: ContraEntregaOption
  ): { rate: number; note?: string } {
    if (type === "contra_entrega") {
      if (contraEntregaChoice === "efectivo_general") return { rate: 0.2 };
      if (contraEntregaChoice === "efectivo_promos") return { rate: 0.15 };
      if (contraEntregaChoice === "cheque_30") {
        if (!isNaN(docDays) && docDays <= 30) return { rate: 0.13 };
        return { rate: 0, note: "Cheque > 30 días: sin descuento" };
      }
      return { rate: 0 };
    }
    if (isNaN(docDays))
      return { rate: 0, note: "Fecha/estimación de días inválida" };
    if (docDays <= 15) return { rate: 0.13 };
    if (docDays <= 30) return { rate: 0.1 };
    if (docDays > 45) return { rate: 0, note: "Actualización de precios" };
    return { rate: 0, note: "Precio facturado (0%)" };
  }

  const addContraEntregaValor = () => {
    const n = parseFloat((contraEntregaMonto || "").replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;

    const concept =
      contraEntregaOpt === "efectivo_general"
        ? "Pago contra entrega (General 20%)"
        : contraEntregaOpt === "efectivo_promos"
        ? "Pago contra entrega (Promos 15%)"
        : "Pago contra entrega (Cheque ≤ 30 días 13%)";

    const method: PaymentMethod =
      contraEntregaOpt === "cheque_30" ? "cheque" : "efectivo";

    const next: ValueItem = {
      amount: n.toFixed(2),
      selectedReason: concept,
      method,
    };

    const idx = newValues.findIndex((v) => v.selectedReason === concept);
    if (idx >= 0) {
      const clone = [...newValues];
      clone[idx] = next;
      setNewValues(clone);
    } else {
      setNewValues([next, ...newValues]);
    }
    setContraEntregaMonto("");
  };

  const computedDiscounts = newPayment.map((doc) => {
    const days = getDocDays(doc);
    const { rate, note } = getDiscountRateForDoc(
      days,
      paymentTypeUI,
      contraEntregaOpt
    );
    const base = parseFloat(doc.saldo_a_pagar || "0") || 0;
    const discountAmount = +(base * rate).toFixed(2);
    const finalAmount = +(base - discountAmount).toFixed(2);
    return {
      document_id: doc.document_id,
      number: doc.number,
      days,
      base,
      rate,
      discountAmount,
      finalAmount,
      note,
    };
  });

  const totalBase = computedDiscounts.reduce((a, d) => a + d.base, 0);
  const totalDiscount = computedDiscounts.reduce(
    (a, d) => a + d.discountAmount,
    0
  );
  const totalAfterDiscount = computedDiscounts.reduce(
    (a, d) => a + d.finalAmount,
    0
  );

  const totalValues = newValues.reduce(
    (total, v) => total + parseFloat(v.amount || "0"),
    0
  );
  const diff = +(totalAfterDiscount - totalValues).toFixed(2);

  const formattedTotalGross = currencyFmt.format(totalBase);
  const formattedTotalNet = currencyFmt.format(totalAfterDiscount);
  const formattedTotalValues = currencyFmt.format(totalValues);
  const formattedDiff = currencyFmt.format(diff);

  const { data } = useGetCustomerInformationByCustomerIdQuery({
    id: selectedClientId ?? undefined,
  });

  if (!isOpen) return null;

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
    "values",
    "documents",
    "comments",
  ];

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
            <InfoRow label="Importe bruto" value={formattedTotalGross} />
            <InfoRow label="Importe neto (c/desc)" value={formattedTotalNet} />
            <InfoRow label="Valores" value={formattedTotalValues} />
            <InfoRow
              label="Diferencia"
              value={formattedDiff}
              valueClassName={
                diff === 0
                  ? "text-emerald-500"
                  : diff > 0
                  ? "text-amber-400"
                  : "text-red-500"
              }
            />
            {newPayment.length > 0 &&
              newPayment.map((item, index) => (
                <InfoRow
                  key={index}
                  label={t("paymentModal.daysOfPayment", {
                    number: item.number,
                  })}
                  value={
                    <>
                      <span
                        className={`${
                          item.days_until_expiration_today >
                          item.days_until_expiration
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {item.days_until_expiration}
                      </span>{" "}
                      ({item.days_until_expiration_today ?? "N/A"})
                    </>
                  }
                />
              ))}
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
                      contraEntregaOpt={contraEntregaOpt}
                    />
                  ))}
              </div>
            )}

            {activeTab === "values" && (
              <div className="text-white space-y-4">
                {/* Selector de condición */}
                <div className="flex gap-2">
                  {/* Pago contra entrega (deshabilitado si hay docs) */}
                  <button
                    className={`px-3 py-2 rounded ${
                      paymentTypeUI === "contra_entrega"
                        ? "bg-white text-black"
                        : "bg-zinc-700 text-white"
                    } ${
                      hasSelectedDocs ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      if (!hasSelectedDocs) setPaymentTypeUI("contra_entrega");
                    }}
                    disabled={hasSelectedDocs}
                    title={
                      hasSelectedDocs
                        ? "Con comprobantes seleccionados solo se permite Cuenta corriente"
                        : "Pago contra entrega"
                    }
                  >
                    Pago contra entrega
                  </button>

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
                </div>

                {/* Aviso si hay documentos
                {hasSelectedDocs && (
                  <div className="text-xs text-amber-300">
                    Hay comprobantes seleccionados: se aplica automáticamente{" "}
                    <b>Cuenta corriente</b>.
                  </div>
                )} */}

                {/* Opciones solo para Pago contra entrega (y solo si está permitido) */}
                {paymentTypeUI === "contra_entrega" && !hasSelectedDocs && (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label
                        className={`px-3 py-2 rounded cursor-pointer text-center ${
                          contraEntregaOpt === "efectivo_general"
                            ? "bg-emerald-500 text-black"
                            : "bg-zinc-700 text-white"
                        }`}
                      >
                        <input
                          type="radio"
                          className="hidden"
                          checked={contraEntregaOpt === "efectivo_general"}
                          onChange={() =>
                            setContraEntregaOpt("efectivo_general")
                          }
                        />
                        Efectivo (General 20%)
                      </label>
                      <label
                        className={`px-3 py-2 rounded cursor-pointer text-center ${
                          contraEntregaOpt === "efectivo_promos"
                            ? "bg-emerald-500 text-black"
                            : "bg-zinc-700 text-white"
                        }`}
                      >
                        <input
                          type="radio"
                          className="hidden"
                          checked={contraEntregaOpt === "efectivo_promos"}
                          onChange={() =>
                            setContraEntregaOpt("efectivo_promos")
                          }
                        />
                        Efectivo (Promos 15%)
                      </label>
                      <label
                        className={`px-3 py-2 rounded cursor-pointer text-center ${
                          contraEntregaOpt === "cheque_30"
                            ? "bg-emerald-500 text-black"
                            : "bg-zinc-700 text-white"
                        }`}
                      >
                        <input
                          type="radio"
                          className="hidden"
                          checked={contraEntregaOpt === "cheque_30"}
                          onChange={() => setContraEntregaOpt("cheque_30")}
                        />
                        Cheque ≤ 30 días (13%)
                      </label>
                    </div>
                    <div className="mt-3 flex gap-2 w-full">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="Monto (ARS)"
                        value={contraEntregaMonto}
                        onChange={(e) => setContraEntregaMonto(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addContraEntregaValor();
                        }}
                        className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-700"
                      />
                      <button
                        onClick={addContraEntregaValor}
                        disabled={
                          !contraEntregaMonto ||
                          parseFloat(
                            (contraEntregaMonto || "").replace(",", ".")
                          ) <= 0
                        }
                        className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}

                {/* Nota para Cuenta Corriente */}
                {/* {paymentTypeUI === "cta_cte" && (
                  <div className="text-sm text-zinc-300">
                    El descuento se calcula automáticamente por documento según{" "}
                    <code>days_until_expiration_today</code>: ≤ 15 días = 13%, ≤
                    30 días = 10%, 30–45 días = 0%, {">"} 45 días =
                    actualización.
                  </div>
                )} */}

                {/* Tabla de desglose */}
                {computedDiscounts.length > 0 && (
                  <div className="space-y-3">
                    {computedDiscounts.map((d) => (
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
                            <span className="truncate min-w-0" title={d.number}>
                              {d.number}
                            </span>
                          </div>

                          <div className="flex justify-between px-3 py-2">
                            <span className="text-zinc-400">Días</span>
                            <span
                              className={`tabular-nums ${
                                d.note ? "text-yellow-400" : ""
                              }`}
                            >
                              {isNaN(d.days) ? "—" : d.days}
                            </span>
                          </div>

                          <div className="flex justify-between px-3 py-2">
                            <span className="text-zinc-400">Base</span>
                            <span className="tabular-nums">
                              {currencyFmt.format(d.base)}
                            </span>
                          </div>

                          <div className="flex justify-between px-3 py-2">
                            <span className="text-zinc-400">%</span>
                            <span className="tabular-nums">
                              {(d.rate * 100).toFixed(0)}%
                            </span>
                          </div>

                          <div className="flex justify-between px-3 py-2">
                            <span className="text-zinc-400">Desc.</span>
                            <span className="tabular-nums">
                              -{currencyFmt.format(d.discountAmount)}
                            </span>
                          </div>

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
                            <div className="px-3 py-2 text-xs text-yellow-400">
                              {d.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Totales (en filas) */}
                    {/* <div className="border border-zinc-700 rounded overflow-hidden">
                      <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-700">
                        Total
                      </div>
                      <div className="divide-y divide-zinc-800 text-sm text-white">
                        <div className="flex justify-between px-3 py-2">
                          <span className="text-zinc-400">Bruto</span>
                          <span className="tabular-nums">
                            {currencyFmt.format(totalBase)}
                          </span>
                        </div>
                        <div className="flex justify-between px-3 py-2">
                          <span className="text-zinc-400">Desc.</span>
                          <span className="tabular-nums">
                            -{currencyFmt.format(totalDiscount)}
                          </span>
                        </div>
                        <div className="flex justify-between px-3 py-2">
                          <span className="text-zinc-400">Neto</span>
                          <span className="tabular-nums">
                            {currencyFmt.format(totalAfterDiscount)}
                          </span>
                        </div>
                        <div className="flex justify-between px-3 py-2">
                          <span className="text-zinc-400">Valores</span>
                          <span className="tabular-nums">
                            {currencyFmt.format(totalValues)}
                          </span>
                        </div>
                        <div className="flex justify-between px-3 py-2">
                          <span className="text-zinc-400">Dif.</span>
                          <span
                            className={`tabular-nums ${
                              diff === 0
                                ? "text-emerald-400"
                                : diff > 0
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {currencyFmt.format(diff)}
                          </span>
                        </div>
                      </div>
                    </div> */}
                  </div>
                )}

                {/* Volcar neto con descuento a Valores */}
                {/* Volcar neto con descuento a Valores (con comprobante opcional) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    const base = pendingValueRef.current;
                    // limpiar para el próximo uso
                    pendingValueRef.current = null;
                    e.target.value = "";

                    // si por algún motivo no hay base, salimos
                    if (!base) return;

                    // si el usuario canceló el picker, agregamos igual sin comprobante
                    if (!file) {
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
                      return;
                    }

                    try {
                      const res = await uploadImage(file).unwrap();
                      const withReceipt = {
                        ...base,
                        receiptUrl: (res as any).secure_url || (res as any).url,
                        receiptOriginalName: file.name,
                      };

                      setNewValues((prev) => {
                        const idx = prev.findIndex(
                          (v) => v.selectedReason === base.selectedReason
                        );
                        if (idx >= 0) {
                          const clone = [...prev];
                          clone[idx] = withReceipt;
                          return clone;
                        }
                        return [withReceipt, ...prev];
                      });
                    } catch (err) {
                      console.error(err);
                      // fallback: agregamos sin comprobante si falló el upload
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
                      alert(
                        "No se pudo subir el comprobante. Se agregó el valor sin archivo."
                      );
                    }
                  }}
                />

                <button
                  className="mt-1 px-3 py-2 rounded bg-blue-500 text-white disabled:opacity-60"
                  onClick={() => {
                    // método sugerido según opción elegida
                    const method: PaymentMethod =
                      paymentTypeUI === "contra_entrega" &&
                      contraEntregaOpt === "cheque_30"
                        ? "cheque"
                        : "efectivo";

                    // armamos el ValueItem base
                    const base: ValueItem = {
                      amount: totalAfterDiscount.toFixed(2),
                      selectedReason: "Pago a factura",
                      method,
                      bank: undefined,
                    };

                    // guardamos temporalmente para que el onChange lo complete (o lo agregue “as is” si se cancela)
                    pendingValueRef.current = base;

                    // abrimos el file picker; si el usuario cancela, igual se agrega sin comprobante
                    fileInputRef.current?.click();
                  }}
                  disabled={computedDiscounts.length === 0 || isUploading}
                >
                  {isUploading
                    ? "Subiendo..."
                    : "Agregar a Valores (+ comprobante)"}
                </button>

                {/* Valores manuales */}
                <ValueView setNewValues={setNewValues} newValues={newValues} />
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
            onClick={() => setIsConfirmModalOpen(true)}
            className="w-full bg-blue-500 text-white py-3 rounded-md font-medium"
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
          onConfirm={handleCreatePayment} // 👈 acá
          isLoading={isCreating || isSubmittingPayment}
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
  title,
  children,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  children?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      {/* backdrop del confirm */}
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      {/* contenido del confirm */}
      <div
        className="relative w-full max-w-lg rounded-xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h4 className="text-lg font-semibold">{title}</h4>
        </div>
        <div className="p-4 space-y-3">{children}</div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className={`px-3 py-2 rounded text-white ${
              isLoading
                ? "bg-amber-500 cursor-wait"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
