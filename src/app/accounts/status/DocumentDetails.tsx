"use client";

import { useGetDocumentByIdQuery } from "@/redux/services/documentsApi";
import { useGetPaymentConditionByIdQuery } from "@/redux/services/paymentConditionsApi";
import { X } from "lucide-react";
import { AiOutlineCheck } from "react-icons/ai";

export default function DocumentDetails({ documentId, onClose }: { documentId: string; onClose: () => void; }) {
  const {
    data: invoice,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetDocumentByIdQuery(
    { id: documentId },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  const {
    data: paymentsConditionsData,
    error: paymentError,
    isLoading: isPaymentLoading,
  } = useGetPaymentConditionByIdQuery({
    id: invoice?.payment_condition_id || "",
  });

  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: any) => {
    return Number(amount).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl">
        <div className="flex items-center justify-between p-3 bg-gray-200 rounded-t-lg">
          <h2 className="text-lg font-medium text-gray-800">
            Detalle {invoice?.type} {invoice?.number}
          </h2>
          <button
            onClick={() => {
              console.log("Cerrando modal...");
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-medium">{formatDate(invoice?.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Saldo:</span>
                <span className="font-medium">$ {formatCurrency(invoice?.balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sucursal:</span>
                <span className="font-medium">{invoice?.branch_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha Vencimiento:</span>
                <span className="font-medium">{formatDate(invoice?.expiration_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transporte:</span>
                <span className="font-medium">{invoice?.transport_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">{invoice?.customer_id}</span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Importe:</span>
                <span className="font-medium">$ {formatCurrency(invoice?.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Importe Neto:</span>
                <span className="font-medium">$ {formatCurrency(invoice?.netamount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                {invoice?.expiration_status === "VENCIDO" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {invoice.expiration_status}
                  </span>
                ) : invoice?.expiration_status === "" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <AiOutlineCheck className="mr-1" />
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {invoice?.expiration_status}
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Condición de Pago:</span>
                <span className="font-medium">{paymentsConditionsData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vendedor:</span>
                <span className="font-medium">{invoice?.seller_id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
