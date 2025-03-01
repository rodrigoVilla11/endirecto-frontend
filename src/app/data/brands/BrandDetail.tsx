import React from "react";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface BrandDetailProps {
  data: any;
  onClose: () => void;
}

const BrandDetail: React.FC<BrandDetailProps> = ({ data, onClose }) => {
  const { t } = useTranslation();

  if (!data) return null;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-xl font-bold">{data.name}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FaTimes className="w-6 h-6" />
        </button>
      </div>
      <div className="space-y-2">
        <p>
          <span className="font-semibold">{t("table.id")}:</span> {data.id}
        </p>
        <p>
          <span className="font-semibold">{t("table.name")}:</span> {data.name}
        </p>
        <p>
          <span className="font-semibold">{t("table.sequence")}:</span> {data.sequence}
        </p>
        {/* Agrega más detalles según lo requieras */}
      </div>
    </div>
  );
};

export default BrandDetail;
