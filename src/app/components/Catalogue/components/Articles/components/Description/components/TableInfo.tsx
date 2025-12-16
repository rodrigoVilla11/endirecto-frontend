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
      isLong: true,
    },
  ];

  return (
    <div className="space-y-2">
      {infoRows.map((row, index) => (
        <div key={index}>
          <div
            className="
            flex justify-between items-start
            p-3 rounded-xl
            bg-white/0
            hover:bg-white/5
            transition-all duration-200
          "
          >
            {/* Label */}
            <p className="font-extrabold text-white text-sm tracking-wide">
              {row.label}
            </p>

            {/* Value */}
            <p
              className={`
              font-normal
              text-white/70
              text-sm text-right
              ${
                row.isLong
                  ? "max-w-xs break-words overflow-y-auto max-h-24 hide-scrollbar"
                  : "max-w-xs"
              }
            `}
            >
              {row.value}
            </p>
          </div>

          {index < infoRows.length - 1 && <hr className="border-white/10" />}
        </div>
      ))}
    </div>
  );
};

export default TableInfo;
