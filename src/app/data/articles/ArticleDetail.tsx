import React from "react";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";

interface ArticleDetailProps {
  data: any;
  onClose: () => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ data, onClose }) => {
  const { t } = useTranslation();

  

  return (
    <div className="p-4 bg-white rounded-2xl">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-xl font-bold">{data.name}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FaTimes className="w-6 h-6" />
        </button>
      </div>
      <div className="space-y-2">
        <p>
          <span className="font-semibold">{t("brand")}:</span>{" "}
          {data.brand|| t("noBrand")}
        </p>
        <p>
          <span className="font-semibold">{t("item")}:</span>{" "}
          {data.item || t("noItem")}
        </p>
        <p>
          <span className="font-semibold">{t("supplierCode")}:</span>{" "}
          {data.supplier_code}
        </p>
        <p>
          <span className="font-semibold">{t("description")}:</span>{" "}
          {data.description || t("noDescription")}
        </p>
        {/* Agrega aquí más detalles según lo requieras */}
      </div>
    </div>
  );
};

export default ArticleDetail;
