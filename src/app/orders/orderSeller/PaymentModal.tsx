"use client";

import { useState } from "react";
import { DocumentsView } from "./DocumentsView";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerInformationByCustomerIdQuery } from "@/redux/services/customersInformations";
import ValueView from "./ValueView";
import { CommentsView } from "./CommentsView";
import { useTranslation } from "react-i18next";
import { CreatePayment, PaymentStatus, useCreatePaymentMutation } from "@/redux/services/paymentsApi";
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentType = "contra_entrega" | "cta_cte";
type ContraEntregaOption = "efectivo_general" | "efectivo_promos" | "cheque_30";

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { t } = useTranslation();
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
    selectedReason: string; // podés usarlo para “concepto”
    method: PaymentMethod;
    bank?: string;
    receipt?: File | string; // File en UI; podés mapearlo a URL al enviar
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

  function daysFromInvoice(dateStr?: string) {
    if (!dateStr) return NaN;
    const d = new Date(dateStr);
    const today = new Date();
    const diffMs = today.getTime() - d.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Preferimos days_until_expiration_today; si no viene, caemos a días desde fecha factura
  function getDocDays(doc: {
    days_until_expiration_today?: any;
    date?: string;
  }) {
    const v = Number(doc.days_until_expiration_today);
    if (Number.isFinite(v)) return v;
    return daysFromInvoice(doc.date);
  }

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

    // ---- CUENTA CORRIENTE (auto) ----
    if (isNaN(docDays))
      return { rate: 0, note: "Fecha/estimación de días inválida" };

    if (docDays <= 15) return { rate: 0.13 }; // 13%
    if (docDays <= 30) return { rate: 0.1 }; // 10%
    if (docDays > 45) return { rate: 0, note: "Actualización de precios" }; // aviso
    // 30 < días ≤ 45
    return { rate: 0, note: "Precio facturado (0%)" };
  }

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

  // ---- Datos externos (RTK Query) ----
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
            {/* Resumen */}
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

            {/* Días hasta vencimiento por doc (si querés mantenerlo) */}
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
            {(["documents", "values", "comments"] as const).map((tabKey) => (
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
                    />
                  ))}
              </div>
            )}

            {activeTab === "values" && (
              <div className="text-white space-y-4">
                {/* Selector de condición (solo dos botones) */}
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-2 rounded ${
                      paymentTypeUI === "contra_entrega"
                        ? "bg-white text-black"
                        : "bg-zinc-700 text-white"
                    }`}
                    onClick={() => setPaymentTypeUI("contra_entrega")}
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

                {/* Opciones solo para Pago contra entrega */}
                {paymentTypeUI === "contra_entrega" && (
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
                        onChange={() => setContraEntregaOpt("efectivo_general")}
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
                        onChange={() => setContraEntregaOpt("efectivo_promos")}
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
                )}

                {/* Nota para Cuenta Corriente */}
                {paymentTypeUI === "cta_cte" && (
                  <div className="text-sm text-zinc-300">
                    El descuento se calcula automáticamente por documento según{" "}
                    <code>days_until_expiration_today</code>: ≤ 15 días = 13%, ≤
                    30 días = 10%, 30–45 días = 0%, {">"} 45 días =
                    actualización.
                  </div>
                )}

                {/* Tabla de desglose */}
                {computedDiscounts.length > 0 && (
                  <div className="border border-zinc-700 rounded">
                    <div className="grid grid-cols-6 px-3 py-2 text-xs text-zinc-400 border-b border-zinc-700">
                      <span>Factura</span>
                      <span>Días</span>
                      <span>Base</span>
                      <span>%</span>
                      <span>Desc.</span>
                      <span>Final</span>
                    </div>
                    {computedDiscounts.map((d) => (
                      <div
                        key={d.document_id}
                        className="grid grid-cols-6 px-3 py-2 text-sm text-white border-b border-zinc-800"
                        title={d.note || ""}
                      >
                        <span>{d.number}</span>
                        <span className={d.note ? "text-yellow-400" : ""}>
                          {isNaN(d.days) ? "—" : d.days}
                        </span>
                        <span>{currencyFmt.format(d.base)}</span>
                        <span>{(d.rate * 100).toFixed(0)}%</span>
                        <span>-{currencyFmt.format(d.discountAmount)}</span>
                        <span className={d.note ? "text-yellow-400" : ""}>
                          {currencyFmt.format(d.finalAmount)}
                        </span>
                      </div>
                    ))}
                    <div className="px-3 py-2 text-sm text-white flex justify-between">
                      <span>Total</span>
                      <span>
                        {currencyFmt.format(totalBase)} → Descuento: -
                        {currencyFmt.format(totalDiscount)} ={" "}
                        <strong>
                          {currencyFmt.format(totalAfterDiscount)}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Volcar neto con descuento a Valores */}
                <button
                  className="mt-1 px-3 py-2 rounded bg-blue-500 text-white disabled:opacity-60"
                  onClick={() => {
                    const next: ValueItem = {
                      amount: totalAfterDiscount.toFixed(2),
                      selectedReason: "Pago con descuento",
                      method: "efectivo", // por defecto
                      bank: undefined,
                      receipt: undefined,
                    };
                    const idx = newValues.findIndex(
                      (v) => v.selectedReason === "Pago con descuento"
                    );
                    if (idx >= 0) {
                      const clone = [...newValues];
                      clone[idx] = next;
                      setNewValues(clone);
                    } else {
                      setNewValues([next, ...newValues]);
                    }
                  }}
                  disabled={computedDiscounts.length === 0}
                >
                  Usar total con descuento en Valores
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

      {/* Confirm Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-4">
              {t("paymentModal.confirmPayment")}
            </h3>

            {/* Lista de valores */}
            {newValues.length === 0 ? (
              <div className="text-zinc-400 text-sm mb-4">
                No hay valores cargados. Volvé y agregá al menos uno.
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {newValues.map((v, i) => (
                  <div
                    key={i}
                    className="border border-zinc-700 rounded p-3 text-sm text-white bg-zinc-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {v.selectedReason || "Valor sin concepto"}
                      </span>
                      <span>
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        }).format(parseFloat(v.amount || "0") || 0)}
                      </span>
                    </div>
                    <div className="mt-1 text-zinc-300">
                      Medio: <b>{v.method}</b>
                      {v.bank ? (
                        <>
                          {" "}
                          · Banco: <b>{v.bank}</b>
                        </>
                      ) : null}
                      {v.receipt ? " · Comprobante adjunto" : ""}
                    </div>
                  </div>
                ))}

                {/* Total de valores */}
                <div className="flex items-center justify-between text-white text-sm pt-2 border-t border-zinc-700">
                  <span>Total valores</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(
                      newValues.reduce(
                        (acc, v) => acc + (parseFloat(v.amount || "0") || 0),
                        0
                      )
                    )}
                  </span>
                </div>

                {/* Diferencia */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">Diferencia</span>
                  <span
                    className={
                      diff === 0
                        ? "text-emerald-400 font-semibold"
                        : diff > 0
                        ? "text-amber-400 font-semibold"
                        : "text-red-400 font-semibold"
                    }
                  >
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(diff)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-zinc-600 text-white rounded"
              >
                {t("paymentModal.cancel")}
              </button>

              <button
                onClick={async () => {
                  const nowIso = new Date().toISOString();

                  const ruleAppliedFor = (docDays: number) => {
                    if (paymentTypeUI === "contra_entrega") {
                      if (contraEntregaOpt === "efectivo_general")
                        return "efectivo_general";
                      if (contraEntregaOpt === "efectivo_promos")
                        return "efectivo_promos";
                      if (contraEntregaOpt === "cheque_30") {
                        if (!Number.isNaN(docDays) && docDays <= 30)
                          return "cheque<=30";
                        return "cheque>30";
                      }
                      return "contra_entrega";
                    }
                    if (Number.isNaN(docDays)) return "cta_cte_unknown";
                    if (docDays <= 15) return "cta_cte<=15";
                    if (docDays <= 30) return "cta_cte<=30";
                    if (docDays <= 45) return "precio_facturado";
                    return "actualizacion_precios";
                  };

                  // 🔧 Tipamos el payload y usamos el tipo de estado correcto
                  const payload: CreatePayment = {
                    status: "confirmed" as PaymentStatus, // <- evita "string" genérico
                    customer: { id: selectedClientId ?? "" },
                    currency: "ARS",
                    date: nowIso,
                    type: paymentTypeUI,
                    contra_entrega_choice:
                      paymentTypeUI === "contra_entrega"
                        ? contraEntregaOpt
                        : undefined,

                    totals: {
                      gross: +totalBase.toFixed(2),
                      discount: +totalDiscount.toFixed(2),
                      net: +totalAfterDiscount.toFixed(2),
                      values: +newValues
                        .reduce(
                          (acc, v) => acc + (parseFloat(v.amount || "0") || 0),
                          0
                        )
                        .toFixed(2),
                      diff: +diff.toFixed(2),
                    },

                    // compat: igual a totals.net
                    total: +totalAfterDiscount.toFixed(2),

                    documents: computedDiscounts.map((d) => ({
                      document_id: d.document_id,
                      number: d.number,
                      days_used: Number.isNaN(d.days) ? undefined : d.days,
                      rule_applied: ruleAppliedFor(d.days),
                      base: +d.base.toFixed(2),
                      discount_rate: +d.rate.toFixed(4),
                      discount_amount: +d.discountAmount.toFixed(2),
                      final_amount: +d.finalAmount.toFixed(2),
                      note: d.note,
                    })),

                    payment_condition: {
                      id: newPayment[0]?.payment_condition ?? "default",
                    },

                    values: newValues.map((v) => ({
                      amount: +(parseFloat(v.amount || "0") || 0).toFixed(2),
                      concept: v.selectedReason,
                      method: v.method, // "efectivo" | "transferencia" | "cheque"
                      bank: v.bank || undefined,
                      receipt_url:
                        typeof v.receipt === "string" ? v.receipt : undefined,
                      receipt_original_name:
                        typeof v.receipt === "object" && v.receipt
                          ? (v.receipt as File).name
                          : undefined,
                    })),

                    user: { id: "web" }, // TODO: reemplazar por el user real
                    comments,
                    source: "web",
                    version: 1,
                    isCharged: false, // opcional en CreatePayment, requerido en tu modelo
                    // ❌ NO incluyas multisoft_id si no tenés valor
                  };

                  console.log("POST /payments payload:", payload);

                  setIsSubmittingPayment(true);
                  setSubmittedPayment(false);
                  try {
                    await createPayment(payload).unwrap();
                    setSubmittedPayment(true);
                    setTimeout(() => {
                      setIsSubmittingPayment(false);
                      setSubmittedPayment(false);
                      setIsConfirmModalOpen(false);
                      onClose();
                    }, 800);
                  } catch (error) {
                    console.error("Error creando payment:", error);
                    setIsSubmittingPayment(false);
                  }
                }}
              >
                {isSubmittingPayment
                  ? t("paymentModal.loading") || "Cargando..."
                  : submittedPayment
                  ? "✓"
                  : t("paymentModal.confirm")}
              </button>
            </div>
          </div>
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
