import React from "react";
import Tables from "./components/Tables";
import { useTranslation } from "react-i18next";

const Description = ({ article, description }: any) => {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-4">
      {/* Descripción */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-purple-500">📝</span>
          {t("description")}
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed max-h-36 overflow-y-auto hide-scrollbar">
          {description || t("noDescription")}
        </p>
      </div>

      {/* Tablas */}
      <Tables article={article} />
    </div>
  );
};

export default Description;