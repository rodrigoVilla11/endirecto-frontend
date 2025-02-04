"use client";

import { useState } from "react";
import { DocumentsView } from "./DocumentsView";

import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerInformationByCustomerIdQuery } from "@/redux/services/customersInformations";
import ValueView from "./ValueView";
import { CommentsView } from "./CommentsView";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState("COMPROBANTES");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { selectedClientId } = useClient();
  const [comments, setComments] = useState("");
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

  const [newValues, setNewValues] = useState<
    { amount: string; selectedReason: string; currency: string }[]
  >([]);

  function sumSaldoAPagar(documents: { saldo_a_pagar: string }[]): number {
    return documents.reduce(
      (total, doc) => total + parseFloat(doc.saldo_a_pagar || "0"),
      0
    );
  }
  const totalSaldoAPagar = sumSaldoAPagar(newPayment);

  function sumAmounts(newValues: { amount: string }[]): number {
    return newValues.reduce(
      (total, value) => total + parseFloat(value.amount || "0"),
      0
    );
  }
  const totalValues = sumAmounts(newValues);

  const formattedTotal = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalSaldoAPagar);

  const formattedTotalValues = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalValues);

  const diff = totalSaldoAPagar - totalValues;

  const formattedDiff = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(diff);

  const { data, error, isLoading } = useGetCustomerInformationByCustomerIdQuery(
    { id: selectedClientId ?? undefined }
  );
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
    <div className="fixed inset-0 bg-black/90 z-50" onClick={onClose}>
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
            <h2 className="text-xl font-semibold text-white">Pago</h2>
          </div>
          <span className="text-white">📄</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="border-b border-zinc-800">
            <InfoRow label="Fecha" value={formattedDate} />
            <InfoRow
              label={
                <div className="flex items-center gap-2">
                  Gps <span className="text-red-500">📍</span>
                </div>
              }
              value={<span className="text-yellow-500">No Insitu</span>}
            />
            <InfoRow label="Importe Bruto" value={formattedTotal} />
            <InfoRow label="Importe Neto" value={formattedTotal} />
            <InfoRow label="Valores" value={formattedTotalValues} />
            <InfoRow
              label="Diferencia"
              value={formattedDiff}
              valueClassName="text-emerald-500"
            />
            {/* Mostrar días de pago si hay documentos en newPayment */}
            {newPayment.length > 0 &&
              newPayment.map((item, index) => (
                <InfoRow
                  key={index}
                  label={`Días de Pago ${item.number}`}
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
            {["COMPROBANTES", "VALORES", "COMENTARIOS"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`p-4 text-sm font-medium ${
                  activeTab === tab
                    ? "bg-white text-black"
                    : "bg-zinc-900 text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "COMPROBANTES" && (
              <div className="text-white">
                {data?.documents.map((item) => (
                  <DocumentsView
                    key={item.id} // Agregar una key única para mejorar el rendimiento en React
                    document_id={item.id}
                    customerInformation={item}
                    onRowSelect={handleRowSelect}
                    selectedRows={selectedRows}
                    setNewPayment={setNewPayment}
                  />
                ))}
              </div>
            )}
            {activeTab === "VALORES" && (
              <div className="text-white">
                <ValueView setNewValues={setNewValues} newValues={newValues} />
              </div>
            )}
            {activeTab === "COMENTARIOS" && (
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
            ENVIAR
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirmar Pago
            </h3>
            <input
              type="number"
              placeholder="Monto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 mb-4 bg-zinc-700 text-white rounded"
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 mb-4 bg-zinc-700 text-white rounded"
            >
              <option value="">Seleccionar método de pago</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-zinc-600 text-white rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Aquí iría la lógica para procesar el pago
                  console.log("Pago confirmado:", { amount, paymentMethod });
                  setIsConfirmModalOpen(false);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Confirmar
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
