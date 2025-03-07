import React from "react";
import { FaTimes } from "react-icons/fa";
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
  return (
    <div className="p-4">
      {/* Encabezado con título y botón para cerrar */}
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-xl font-bold">
          {t("crmDetailTitle")} {data.number ? `- ${data.number}` : ""}
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FaTimes className="w-6 h-6" />
        </button>
      </div>

      {/* Detalles del CRM */}
      <div className="space-y-2">
        <p>
          <span className="font-semibold">{t("seller")}:</span>{" "}
          {data.seller_id || t("notAvailable")}
        </p>
        <p>
          <span className="font-semibold">{t("customer")}:</span>{" "}
          {data.customer_id || t("notAvailable")}
        </p>
        <p>
          <span className="font-semibold">{t("date")}:</span>{" "}
          {data.date || t("notAvailable")}
        </p>
        <p>
          <span className="font-semibold">{t("type")}:</span>{" "}
          {data.type || t("notAvailable")}
        </p>
        <p>
          <span className="font-semibold">{t("number")}:</span>{" "}
          {orderData?.multisoft_id || t("notAvailable")}
        </p>
        <p>
          <span className="font-semibold">{t("amount")}:</span>{" "}
          {formatCurrency(orderData?.total) || t("notAvailable")}

        </p>
        <p>
          <span className="font-semibold">{t("notes")}:</span>{" "}
          {data.notes || t("notAvailable")}
        </p>
        <p>
          <span className="font-semibold">{t("status")}:</span>{" "}
          {data.status || t("notAvailable")}
        </p>
        <p>
          <span className="font-semibold">{t("gps")}:</span>{" "}
          {data.gps || t("notAvailable")}
        </p>
      </div>
    </div>
  );
};

export default CRMDetail;
