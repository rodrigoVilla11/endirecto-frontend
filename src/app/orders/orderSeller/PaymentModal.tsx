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
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useAddNotificationToCustomerMutation } from "@/redux/services/customersApi";
import { useAddNotificationToUserByIdMutation } from "@/redux/services/usersApi";
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
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { selectedClientId } = useClient();
  const [comments, setComments] = useState("");
  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
  const [addNotificationToCustomer] = useAddNotificationToCustomerMutation();
  const [addNotificationToUserById] = useAddNotificationToUserByIdMutation();

  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingValueRef = useRef<ValueItem | null>(null);

  type PaymentType = "pago_anticipado" | "cta_cte";

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

  // Valores ingresados
  type PaymentMethod = "efectivo" | "transferencia" | "cheque";
  type ValueItem = {
    amount: string;
    selectedReason: string;
    method: PaymentMethod;
    bank?: string;
    receiptUrl?: string;
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

  // ⛔️ Si hay documentos seleccionados, bloquear contra_entrega y forzar cta_cte
  const hasSelectedDocs = newPayment.length > 0;
  useEffect(() => {
    if (hasSelectedDocs && paymentTypeUI === "pago_anticipado") {
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
    return daysFromInvoice(doc.date);
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
  const buildRuleApplied = (days: number, blockedNoDiscount = false) => {
    if (blockedNoDiscount) return `${paymentTypeUI}:cond_pago_sin_descuento`;

    if (paymentTypeUI === "pago_anticipado") {
      return "pago_anticipado:sin_regla";
    }

    // cta_cte como lo tenías
    if (isNaN(days)) return "cta_cte:invalido";
    if (days <= 15) return "cta_cte:<=15d:13%";
    if (days <= 30) return "cta_cte:<=30d:10%";
    if (days > 45) return "cta_cte:>45d:actualizacion";
    return "cta_cte:0%";
  };

  const handleCreatePayment = async () => {
    if (isCreating || isSubmittingPayment) return;

    const userId = getCurrentUserId();
    if (!userId) return alert("Falta user.id (logueo).");

    if (!selectedClientId) return alert("Falta customer.id.");
    if (newValues.length === 0) return alert("Agregá al menos un valor.");

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
        date: new Date(), // el schema espera Date
        currency: "ARS", // default, pero no molesta
        comments,
        source: "web",

        customer: { id: String(selectedClientId) },
        user: { id: String(userId) },
        seller: { id: String(userData?.seller_id) },
        payment_condition: { id: getPaymentConditionId() },

        totals,

        // el schema dice: "total" (usar NETO). Tiene set toFixed(4)
        total: round4(totalAfterDiscount),

        // Detalle de documentos
        documents: computedDiscounts.map((d) => ({
          document_id: d.document_id,
          number: d.number,
          days_used: isNaN(d.days) ? undefined : d.days,
          rule_applied: buildRuleApplied(d.days, d.noDiscountBlocked),
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
          receipt_url: v.receiptUrl || undefined, // 👈 ahora sí
          receipt_original_name: v.receiptOriginalName || undefined, // 👈 ahora sí
        })),
      } as any; // <- si tu tipo TS frontend no coincide, casteá a any o actualizá el DTO

      console.log("payload", payload)
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
          title: "Pago registrado ${created._id}",
          type: "PAGO",
          description: `${valuesSummary} | Neto: ${currencyFmt.format(
            created?.totals?.net ?? totalAfterDiscount
          )} — Dif: ${currencyFmt.format(diff)}`,
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
            description: `Cliente ${selectedClientId} — Neto ${currencyFmt.format(
              totalAfterDiscount
            )} — Dif ${currencyFmt.format(diff)}`,
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

  function getDiscountRateForDoc(
    docDays: number,
    type: PaymentType,
    docPaymentCondition?: string
  ): { rate: number; note?: string } {
    if (isNoDiscountCondition(docPaymentCondition)) {
      return { rate: 0, note: "Sin descuento por condición de pago" };
    }

    if (type === "pago_anticipado") {
      return { rate: 0, note: "Pago anticipado sin regla" };
    }

    // cta_cte (igual que antes)
    if (isNaN(docDays))
      return { rate: 0, note: "Fecha/estimación de días inválida" };
    if (docDays <= 15) return { rate: 0.13 };
    if (docDays <= 30) return { rate: 0.1 };
    if (docDays > 45) return { rate: 0, note: "Actualización de precios" };
    return { rate: 0, note: "Precio facturado (0%)" };
  }

  // const addContraEntregaValor = () => {
  //   const n = parseFloat((contraEntregaMonto || "").replace(",", "."));
  //   if (!Number.isFinite(n) || n <= 0) return;

  //   const concept =
  //     contraEntregaOpt === "efectivo_general"
  //       ? "Pago contra entrega (General 20%)"
  //       : contraEntregaOpt === "efectivo_promos"
  //       ? "Pago contra entrega (Promos 15%)"
  //       : "Pago contra entrega (Cheque ≤ 30 días 13%)";

  //   const method: PaymentMethod =
  //     contraEntregaOpt === "cheque_30" ? "cheque" : "efectivo";

  //   const next: ValueItem = {
  //     amount: n.toFixed(2),
  //     selectedReason: concept,
  //     method,
  //   };

  //   const idx = newValues.findIndex((v) => v.selectedReason === concept);
  //   if (idx >= 0) {
  //     const clone = [...newValues];
  //     clone[idx] = next;
  //     setNewValues(clone);
  //   } else {
  //     setNewValues([next, ...newValues]);
  //   }
  //   setContraEntregaMonto("");
  // };

  const computedDiscounts = newPayment.map((doc) => {
    const days = getDocDays(doc);
    const noDiscountBlocked = isNoDiscountCondition(doc.payment_condition);

    const { rate, note } = getDiscountRateForDoc(days, paymentTypeUI);

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
      noDiscountBlocked, // 👈 para “rule_applied”
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
    "documents",
    "values",
    "comments",
  ];

  const attachReceipt = (selectedReason: string) => {
    const v = newValues.find((x) => x.selectedReason === selectedReason);
    if (!v) return;
    pendingValueRef.current = v;
    fileInputRef.current?.click();
  };

  const clearReceipt = (selectedReason: string) => {
    setNewValues((prev) =>
      prev.map((v) =>
        v.selectedReason === selectedReason
          ? { ...v, receiptUrl: undefined, receiptOriginalName: undefined }
          : v
      )
    );
  };

  console.log(newPayment);
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

                    // (opcional) check de tamaño 10MB
                    if (file.size > 10 * 1024 * 1024) {
                      alert("El archivo supera 10MB.");
                      return;
                    }

                    try {
                      const res = await uploadImage(file).unwrap();
                      const url =
                        (res as any)?.secure_url ??
                        (res as any)?.url ??
                        (res as any)?.data?.secure_url ??
                        (res as any)?.data?.url;

                      const withReceipt = {
                        ...base,
                        receiptUrl: url, // 👈 usar receiptUrl (camelCase)
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
                    const method: PaymentMethod = "efectivo"; // default; el usuario puede cambiar en ValueView

                    const base: ValueItem = {
                      amount: totalAfterDiscount.toFixed(2),
                      selectedReason: "Pago a factura",
                      method,
                      bank: undefined,
                    };

                    // si ya existe un "Pago a factura", lo reemplazamos; si no, lo agregamos
                    setNewValues((prev) => {
                      const idx = prev.findIndex(
                        (v) => v.selectedReason === base.selectedReason
                      );
                      if (idx >= 0) {
                        const clone = [...prev];
                        clone[idx] = { ...base };
                        return clone;
                      }
                      return [base, ...prev];
                    });
                  }}
                  disabled={
                    computedDiscounts.length ===
                    0 /* ya no dependemos de isUploading */
                  }
                >
                  Agregar a Valores
                </button>

                {/* Valores manuales */}
                <ValueView setNewValues={setNewValues} newValues={newValues} />

                {/* Comprobantes por valor */}
                {newValues.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-semibold text-white">
                      Comprobantes
                    </h4>
                    <ul className="space-y-2">
                      {newValues.map((v) => {
                        const isImg =
                          v.receiptUrl &&
                          !v.receiptUrl.toLowerCase().endsWith(".pdf");
                        return (
                          <li
                            key={v.selectedReason}
                            className="rounded border border-zinc-700 p-3 flex items-center gap-3 text-white"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">
                                {v.selectedReason}
                              </div>
                              <div className="text-xs text-zinc-400">
                                {currencyFmt.format(
                                  parseFloat(v.amount || "0")
                                )}{" "}
                                · {v.method.toUpperCase()}
                              </div>

                              {v.receiptUrl ? (
                                <div className="mt-2 flex items-center gap-3">
                                  {isImg ? (
                                    <img
                                      src={v.receiptUrl}
                                      alt={
                                        v.receiptOriginalName || "Comprobante"
                                      }
                                      className="h-14 w-14 object-cover rounded border border-zinc-700"
                                    />
                                  ) : (
                                    <span className="text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
                                      PDF adjunto
                                    </span>
                                  )}
                                  <a
                                    href={v.receiptUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-300 underline break-all"
                                  >
                                    {v.receiptOriginalName || v.receiptUrl}
                                  </a>
                                </div>
                              ) : (
                                <div className="mt-2 text-xs text-zinc-400">
                                  Sin comprobante
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded bg-zinc-700 text-white hover:bg-zinc-600"
                                onClick={() => attachReceipt(v.selectedReason)}
                              >
                                {v.receiptUrl ? "Reemplazar" : "Adjuntar"}
                              </button>
                              {v.receiptUrl && (
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded border border-red-500 text-red-400 hover:bg-red-500/10"
                                  onClick={() => clearReceipt(v.selectedReason)}
                                >
                                  Quitar
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
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
