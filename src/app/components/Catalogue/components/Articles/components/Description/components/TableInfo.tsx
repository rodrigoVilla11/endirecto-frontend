import React from "react";
import { useTranslation } from "react-i18next";

const TableInfo = ({ article }: any) => {
  const { t } = useTranslation();

  const infoRows = [
    { label: t("code"), value: article.id },
    { label: t("supplierCode"), value: article.supplier_code },
    { label: t("brand"), value: article.brand || t("notAvailable") },
    { label: t("item"), value: article.item || t("notAvailable") },
    { 
      label: t("description"), 
      value: article.description,
      isLong: true 
    },
  ];

  return (
    <div className="space-y-2">
      {infoRows.map((row, index) => (
        <div key={index}>
          <div className="flex justify-between items-start p-3 rounded-lg hover:bg-gradient-to-r hover:from-pink-50 hover:via-purple-50 hover:to-blue-50 transition-all duration-200">
            <p className="font-bold text-gray-700 text-sm">{row.label}</p>
            <p className={`font-normal text-gray-600 text-sm text-right ${
              row.isLong ? 'max-w-xs break-words overflow-y-auto max-h-24 hide-scrollbar' : 'max-w-xs'
            }`}>
              {row.value}
            </p>
          </div>
          {index < infoRows.length - 1 && (
            <hr className="border-gray-200" />
          )}
        </div>
      ))}
    </div>
  );
};

export default TableInfo;