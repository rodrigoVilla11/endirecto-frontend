"use client";

import { useState, useEffect } from "react";
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
    receipt?: File | string;
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

                {/* Aviso si hay documentos */}
                {hasSelectedDocs && (
                  <div className="text-xs text-amber-300">
                    Hay comprobantes seleccionados: se aplica automáticamente{" "}
                    <b>Cuenta corriente</b>.
                  </div>
                )}

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
                  <div className="border border-zinc-700 rounded overflow-hidden">
                    {/* Cabecera */}
                    <div
                      className="
      grid grid-cols-[1.6fr_.6fr_1fr_.6fr_1fr_1fr]
      gap-2 px-3 py-2 text-xs text-zinc-400 border-b border-zinc-700
    "
                    >
                      <span className="truncate">Factura</span>
                      <span className="text-right">Días</span>
                      <span className="text-right">Base</span>
                      <span className="text-right">%</span>
                      <span className="text-right">Desc.</span>
                      <span className="text-right">Final</span>
                    </div>

                    {/* Filas */}
                    {computedDiscounts.map((d) => (
                      <div
                        key={d.document_id}
                        className="
          grid grid-cols-[1.6fr_.6fr_1fr_.6fr_1fr_1fr]
          gap-2 px-3 py-2 text-sm text-white border-b border-zinc-800 items-center
        "
                        title={d.note || ""}
                      >
                        <span className="truncate min-w-0" title={d.number}>
                          {d.number}
                        </span>

                        <span
                          className={`text-right ${
                            d.note ? "text-yellow-400" : ""
                          }`}
                        >
                          {isNaN(d.days) ? "—" : d.days}
                        </span>

                        <span className="text-right whitespace-nowrap tabular-nums">
                          {currencyFmt.format(d.base)}
                        </span>

                        <span className="text-right whitespace-nowrap tabular-nums">
                          {(d.rate * 100).toFixed(0)}%
                        </span>

                        <span className="text-right whitespace-nowrap tabular-nums">
                          -{currencyFmt.format(d.discountAmount)}
                        </span>

                        <span
                          className={`text-right whitespace-nowrap tabular-nums ${
                            d.note ? "text-yellow-400" : ""
                          }`}
                        >
                          {currencyFmt.format(d.finalAmount)}
                        </span>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="px-3 py-2 text-sm text-white flex justify-between items-center">
                      <span>Total</span>
                      <span className="whitespace-nowrap tabular-nums">
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
                      selectedReason: "Pago a factura",
                      method: "efectivo",
                      bank: undefined,
                      receipt: undefined,
                    };
                    const idx = newValues.findIndex(
                      (v) => v.selectedReason === "Pago a factura"
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
                  Agregar a Valores
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
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          {/* ... el resto del modal queda igual a tu versión actual ... */}
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
