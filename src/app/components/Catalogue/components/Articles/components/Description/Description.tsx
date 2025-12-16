import React from "react";
import Tables from "./components/Tables";
import { useTranslation } from "react-i18next";

const Description = ({ article, description }: any) => {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-4">
      {/* Descripción */}
      <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 shadow-xl">
        <h3 className="text-lg font-extrabold text-white mb-3 flex items-center gap-2">
          <span className="text-[#E10600]">📝</span>
          {t("description")}
          <span className="text-[#E10600]">.</span>
        </h3>

        <p className="text-sm text-white/70 leading-relaxed max-h-36 overflow-y-auto hide-scrollbar">
          {description || (
            <span className="text-white/50 italic">{t("noDescription")}</span>
          )}
        </p>

        <div className="mt-4 h-0.5 w-16 bg-[#E10600] opacity-80 rounded-full" />
      </div>

      {/* Tablas */}
      <Tables article={article} />
    </div>
  );
};

export default Description;
