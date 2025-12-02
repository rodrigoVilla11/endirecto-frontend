import React from "react";
import {
  FaTimes,
  FaUser,
  FaCalendarAlt,
  FaFileInvoice,
  FaMapMarkerAlt,
  FaClipboardList,
  FaInfoCircle,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useGetOrderByIdQuery } from "@/redux/services/ordersApi";

interface CRMDetailProps {
  data: any;
  onClose: () => void;
}

const CRMDetail: React.FC<CRMDetailProps> = ({ data, onClose }) => {
  const { t } = useTranslation();

  // Si hay un order_id definido y no es vacío, hacemos lookup para traer toda la info de la orden.
  const shouldLookupOrder = data.order_id && data.order_id.trim() !== "";
  const { data: orderData } = useGetOrderByIdQuery(
    { id: data.order_id },
    { skip: !shouldLookupOrder }
  );

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

  // Función para determinar el color del estado
  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "completado":
      case "aprobado":
      case "finalizado":
      case "completada":
      case "entregada":
      case "pagada":
        return "bg-green-100 text-green-800";
      case "pendiente":
      case "en proceso":
        return "bg-yellow-100 text-yellow-800";
      case "cancelado":
      case "rechazado":
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Si el CRM es de tipo COLLECTION, VISIT o RECLAIM, mostramos una vista simplificada
  if (["COLLECTION", "VISIT", "RECLAIM"].includes(data.type)) {
    return (
      <div className="bg-white rounded-lg shadow-xl max-w-xl mx-auto overflow-hidden">
        {/* Encabezado básico */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {t("crmDetailTitle")}- {data._id?.$oid || data._id || "Sin ID"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200"
            aria-label="Cerrar"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {/* Estado */}
          {data.status && (
            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  data.status
                )}`}
              >
                {data.status}
              </span>
            </div>
          )}
          <div className="mb-4">
            <p className="text-sm text-gray-500">Tipo</p>
            <p className="font-medium">{data.type}</p>
          </div>

          {/* Fecha */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">{t("date")}</p>
            <p className="font-medium">
              {data.date
                ? new Date(data.date.$date || data.date).toLocaleString(
                    "es-ES",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )
                : t("notAvailable")}
            </p>
          </div>

          {/* Notas */}
          {data.notes && (
            <div className="mb-6 bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-500 mb-1">{t("notes")}</p>
              <p className="text-gray-700">{data.notes}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition-colors shadow-sm font-medium"
            >
              {t("close")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si el tipo es ORDER y hay order_id, usamos los datos de orderData si están disponibles.
  const orderInfo = shouldLookupOrder && orderData ? orderData : data;

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header con botón de cerrar */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <FaFileInvoice className="mr-2 text-blue-600" />
          {t("crmDetailTitle")} {data.number ? `- ${data.number}` : ""}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200"
          aria-label="Cerrar"
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {/* Estado */}
        {orderInfo.status && (
          <div className="mb-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                orderInfo.status
              )}`}
            >
              {orderInfo.status}
            </span>
          </div>
        )}

        {/* Datos clave - similar a OrderDetail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-gray-500">Tipo</p>
              <p className="font-medium">{data.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-medium">
                {orderInfo.customer?.id || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vendedor</p>
              <p className="font-medium">
                {orderInfo.seller?.id || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cond. de pago</p>
              <p className="font-medium">
                {orderInfo.payment_condition?.id || "No especificada"}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium">
                {orderInfo.date
                  ? new Date(
                      orderInfo.date.$date || orderInfo.date
                    ).toLocaleString("es-AR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "No disponible"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-medium text-lg text-green-700">
                {formatPriceWithCurrency(orderInfo.total)}
              </p>
            </div>
          </div>
        </div>

        {/* Notas */}
        {orderInfo.notes ? (
          <div className="mb-6 bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500 mb-1">Notas</p>
            <p className="text-gray-700">{orderInfo.notes}</p>
          </div>
        ) : null}

        {/* Detalles del pedido - exactamente como en OrderDetail */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-200">
            Detalles del pedido
          </h3>

          {orderInfo.details?.length > 0 ? (
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
                  {orderInfo.details.map((detail: any, idx: number) => (
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
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-sm transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CRMDetail;
