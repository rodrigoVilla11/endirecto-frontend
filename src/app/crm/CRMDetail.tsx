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

  // Función para determinar el color del estado
  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "completado":
      case "aprobado":
      case "finalizado":
        return "bg-green-100 text-green-800";
      case "pendiente":
      case "en proceso":
        return "bg-yellow-100 text-yellow-800";
      case "cancelado":
      case "rechazado":
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
            {t("crmDetailTitle")} - {data._id?.$oid || data._id || "Sin ID"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200"
            aria-label="Cerrar"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
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
    <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto overflow-hidden">
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

      <div className="p-5">
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

        {/* Información principal en grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">{t("seller")}</p>
              <p className="font-medium">
                {orderInfo.seller?.id || t("notAvailable")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("customer")}</p>
              <p className="font-medium">
                {orderInfo.customer?.id || t("notAvailable")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("paymentCondition")}</p>
              <p className="font-medium">
                {orderInfo.payment_condition?.id || t("notAvailable")}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">{t("date")}</p>
              <p className="font-medium">
                {orderInfo.date
                  ? new Date(
                      orderInfo.date.$date || orderInfo.date
                    ).toLocaleString("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : t("notAvailable")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("total")}</p>
              <p className="font-medium text-lg text-green-700">
                {orderInfo.total
                  ? orderInfo.total.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : t("notAvailable")}
              </p>
            </div>
          </div>
        </div>

        {/* Notas */}
        {orderInfo.notes && (
          <div className="mb-6 bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500 mb-1">{t("notes")}</p>
            <p className="text-gray-700">{orderInfo.notes}</p>
          </div>
        )}

        {/* Detalles del pedido */}
        {orderInfo.details && orderInfo.details.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-200">
              {t("orderDetails")}
            </h3>
            <div className="bg-gray-50 rounded-md overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {orderInfo.details.map((detail: any, index: number) => (
                  <li
                    key={index}
                    className="p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span>{detail.tmp_id}</span>
                      <span className="text-gray-500 text-sm">
                        #{index + 1}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Botón de acción */}
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
};

export default CRMDetail;
