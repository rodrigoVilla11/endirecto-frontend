import React from "react";
import { useTranslation } from "react-i18next";

const TableInfo = ({ article }: any) => {
  const { t } = useTranslation();

  return (
    <div className="text-xs">
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">{t("code")}</p>
        <p className="font-light">{article.id}</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">{t("supplierCode")}</p>
        <p className="font-light">{article.supplier_code}</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">{t("brand")}</p>
        <p className="font-light">{article.brand || t("notAvailable")}</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">{t("item")}</p>
        <p className="font-light max-w-40">
          {article.item || t("notAvailable")}
        </p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">{t("description")}</p>
        <p className="font-light max-w-40 break-words overflow-y-auto max-h-36 hide-scrollbar">
          {article.description}
        </p>
      </div>

      <hr />
    </div>
  );
};

export default TableInfo;
