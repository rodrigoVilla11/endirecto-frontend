import React from "react";
import { useTranslation } from "react-i18next";

interface OrderDetailProps {
  order: any;
  closeModal: () => void;
}

const OrderDetail = ({ order, closeModal }: OrderDetailProps) => {
  const { t } = useTranslation();
  if (!order) return null;

  // Formatea un número a ARS con fallback a '-'
  function formatPriceWithCurrency(value: number | string): string {
    const number = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(number)) {
      return "-";
    }
    // formateo con separador de miles y 2 decimales
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(number)
      .replace("ARS", "")
      .trim();
  }

  const translateStatus = (status?: string) => {
    if (!status) return "";
    const normalized = status.toUpperCase();
    const map: Record<string, string> = {
      PENDING: t("crmd.status.pending"),
      SENDED: t("crmd.status.sended"),
      AUTHORIZED: t("crmd.status.authorized"),
      CHARGED: t("crmd.status.charged"),
      CANCELED: t("crmd.status.canceled"),
    };
    return map[normalized] ?? status;
  };

  // Color según estado
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completada":
      case "entregada":
      case "pagada":
        return "bg-green-100 text-green-800";
      case "pendiente":
      case "en proceso":
        return "bg-yellow-100 text-yellow-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">
          Orden: {order.multisoft_id || "Sin ID"}
        </h2>
        <button
          onClick={closeModal}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Cerrar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {/* Estado */}
        <div className="mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              order.status
            )}`}
          >
            {translateStatus(order.status)}
          </span>
        </div>

        {/* Datos clave */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-medium">
                {order.customer?.id || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vendedor</p>
              <p className="font-medium">
                {order.seller?.id || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cond. de pago</p>
              <p className="font-medium">
                {order.payment_condition?.id || "No especificada"}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium">
                {new Date(order.date).toLocaleString("es-AR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-medium text-lg text-green-700">
                {formatPriceWithCurrency(order.total)}
              </p>
            </div>
          </div>
        </div>

        {/* Notas */}
        {order.notes ? (
          <div className="mb-6 bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500 mb-1">Notas</p>
            <p className="text-gray-700">{order.notes}</p>
          </div>
        ) : null}

        {/* Detalles */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-200">
            Detalles del pedido
          </h3>

          {order.details?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2">Artículo</th>
                    <th className="px-4 py-2">Cantidad</th>
                    <th className="px-4 py-2">Precio uni.</th>
                    <th className="px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.details.map((detail: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {detail.article?.id || detail.id || "-"}
                      </td>
                      <td className="px-4 py-3">{detail.quantity}</td>
                      <td className="px-4 py-3">
                        {formatPriceWithCurrency(detail.netprice)}
                      </td>
                      <td className="px-4 py-3">
                        {formatPriceWithCurrency(detail.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay detalles disponibles.</p>
          )}
        </div>

        {/* Cerrar */}
        <div className="flex justify-end">
          <button
            onClick={closeModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-sm transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
