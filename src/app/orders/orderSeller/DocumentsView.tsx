"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useGetDocumentByIdQuery } from "@/redux/services/documentsApi";
import { useGetPaymentConditionByIdQuery } from "@/redux/services/paymentConditionsApi";

export interface ExpandableTableProps {
  document_id: string;
  customerInformation: any;
  onRowSelect?: (id: string, checked: boolean) => void;
  selectedRows?: string[];
  setNewPayment?: any;
}

export function DocumentsView({
  document_id,
  onRowSelect,
  selectedRows = [],
  customerInformation,
  setNewPayment,
}: ExpandableTableProps) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const { data, error, isLoading } = useGetDocumentByIdQuery({
    id: document_id,
  });

  const {
    data: paymentsConditionsData,
    error: paymentError,
    isLoading: isPaymentLoading,
  } = useGetPaymentConditionByIdQuery({
    id: data?.payment_condition_id || "",
  });

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  function formatPriceWithCurrency(price: number): string {
    const formattedNumber = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(price)
      .replace("ARS", "") // Elimina "ARS" del formato.
      .trim(); // Elimina espacios extra.

    return `${formattedNumber}`; // Agrega el símbolo "$" con espacio al principio.
  }
  function convertToISODate(dateString: string): string {
    const [day, month, year] = dateString.split("/");
    return `${year}-${month}-${day}`; // Convertimos a formato YYYY-MM-DD
  }

  function calculateDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(convertToISODate(startDate));
    const end = new Date(convertToISODate(endDate));

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0; // Si alguna fecha es inválida, devolvemos 0
    }

    // Diferencia en milisegundos y conversión a días
    const differenceInMs = end.getTime() - start.getTime();
    return Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));
  }

  const today = new Date();
  const todayFormatted = today.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const documentDetails = {
    document_id: data?.id || "",
    number: data?.number || "",
    date: data ? formatDate(data.date) : "",
    expiration_date: data ? formatDate(data.expiration_date) : "",
    amount: data ? data.amount : "",
    document_balance: customerInformation
      ? customerInformation.document_balance
      : "",
    payment_condition: paymentsConditionsData?.name || "No especificado",
    // discount: data?.details?.descuento || "0%", // Asumiendo que hay un detalle con descuento
    saldo_a_pagar: customerInformation
      ? customerInformation.document_balance
      : "",
    // 📌 Diferencia entre `date` y `expiration_date`
    days_until_expiration:
      data?.date && data?.expiration_date
        ? calculateDaysBetween(data.date, data.expiration_date)
        : "N/A",

    // 📌 Diferencia entre `date` y la fecha actual (hoy)
    days_until_expiration_today: data?.date
      ? calculateDaysBetween(data.date, todayFormatted)
      : "N/A",
  };
  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      // 📌 Agregar el documento a newPayment si está marcado
      setNewPayment((prev: any[]) => [...prev, documentDetails]);
    } else {
      // 📌 Eliminar el documento de newPayment si se desmarca
      setNewPayment((prev: any[]) =>
        prev.filter((doc) => doc.document_id !== id)
      );
    }

    // 📌 Si existe la función de selección de filas, también la ejecutamos
    onRowSelect?.(id, checked);
  };

  return (
    <div className="w-full space-y-2">
      {data && (
        <div key={data.id} className="bg-gray-900 rounded-lg overflow-hidden">
          {/* Main Row */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedRows.includes(data.id)}
                onChange={(e) =>
                  handleCheckboxChange(data.id, e.target.checked)
                }
                className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <button
                onClick={() => toggleRow(data.id)}
                className="text-gray-400 hover:text-gray-300"
              >
                {expandedRows.includes(data.id) ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
              <div className="flex flex-col">
                <span className="text-gray-200 font-medium">{data.number}</span>
                <span className="text-sm text-gray-400">
                  {formatDate(data.date)} - Vto:{" "}
                  {formatDate(data.expiration_date)}
                </span>
              </div>
            </div>
            <span className="text-gray-200 font-medium">
              {formatPriceWithCurrency(parseInt(data.amount))}
            </span>
          </div>

          {/* Expanded Content */}
          {expandedRows.includes(data.id) && data && (
            <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
              <div className="flex flex-col gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Comprobante</span>
                    <span className="text-gray-200">{data.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Condición de Pago</span>
                    <span className="text-gray-200">
                      {paymentsConditionsData?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Importe</span>
                    <span className="text-gray-200">
                      {formatPriceWithCurrency(parseInt(data.amount))}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Importe</span>
                  <span className="text-gray-200">
                    {formatPriceWithCurrency(
                      parseInt(customerInformation.document_balance)
                    )}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Descuento</span>
                    <span className="text-gray-200">
                      {/* {data.details.descuento}% */} VER BIEN
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-400">Saldo a Pagar</span>
                    <span className="text-gray-200">
                      {formatPriceWithCurrency(
                        parseInt(customerInformation.document_balance)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
