import React from "react";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface CRMDetailProps {
  data: any;
  onClose: () => void;
}

const CRMDetail: React.FC<CRMDetailProps> = ({ data, onClose }) => {
  const { t } = useTranslation();
  console.log(data);
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
          {data.seller || t("notAvailable")}
        </p>
        <p>
          <span className="font-semibold">{t("customer")}:</span>{" "}
          {data.customer || t("notAvailable")}
        </p>
        <p>
          <span className="font-semibold">{t("user")}:</span>{" "}
          {data.user || t("notAvailable")}
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
          {data.number || t("notAvailable")}
        </p>
        <p>
          <span className="font-semibold">{t("amount")}:</span>{" "}
          {data.amount || t("notAvailable")}
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
