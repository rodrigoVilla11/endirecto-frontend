import React from "react";
import { FaTimes, FaUser, FaCalendarAlt, FaFileInvoice, FaMapMarkerAlt, FaClipboardList } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useGetOrderByIdQuery, useGetOrdersQuery } from "@/redux/services/ordersApi";

interface CRMDetailProps {
  data: any;
  onClose: () => void;
}

const CRMDetail: React.FC<CRMDetailProps> = ({ data, onClose }) => {
  const { t } = useTranslation();
  const { data: orderData } = useGetOrderByIdQuery({id: data.order_id});

  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Encabezado con título y botón para cerrar */}
      <div className="flex justify-between items-center bg-gray-50 p-4 border-b">
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

      {/* Contenido principal */}
      <div className="p-5">
        {/* Estado */}
        {data.status && (
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.status)}`}>
              {data.status}
            </span>
          </div>
        )}

        {/* Información organizada en secciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Información del cliente y vendedor */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-3 flex items-center text-gray-700 border-b pb-2">
              <FaUser className="mr-2 text-blue-500" />
              {t("contactInfo")}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">{t("seller")}</p>
                <p className="font-medium">{data.seller_id || t("notAvailable")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("customer")}</p>
                <p className="font-medium">{data.customer_id || t("notAvailable")}</p>
              </div>
            </div>
          </div>

          {/* Información de la orden */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-3 flex items-center text-gray-700 border-b pb-2">
              <FaFileInvoice className="mr-2 text-blue-500" />
              {t("orderInfo")}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">{t("type")}</p>
                <p className="font-medium">{data.type || t("notAvailable")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("number")}</p>
                <p className="font-medium">{orderData?.multisoft_id || t("notAvailable")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("amount")}</p>
                <p className="font-medium text-green-700">
                  {orderData?.total ? formatCurrency(orderData.total) : t("notAvailable")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fecha y ubicación */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-3 flex items-center text-gray-700 border-b pb-2">
              <FaCalendarAlt className="mr-2 text-blue-500" />
              {t("dateAndLocation")}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">{t("date")}</p>
                <p className="font-medium">{data.date || t("notAvailable")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("gps")}</p>
                <div className="flex items-center">
                  {data.gps ? (
                    <>
                      <FaMapMarkerAlt className="text-red-500 mr-1" />
                      <p className="font-medium">{data.gps}</p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">{t("notAvailable")}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-3 flex items-center text-gray-700 border-b pb-2">
              <FaClipboardList className="mr-2 text-blue-500" />
              {t("additionalInfo")}
            </h3>
            <div>
              <p className="text-sm text-gray-500">{t("notes")}</p>
              {data.notes ? (
                <p className="font-medium">{data.notes}</p>
              ) : (
                <p className="text-gray-500 italic">{t("notAvailable")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMDetail;