import React from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

type ArticleEquivalenceProps = {
  articleVehicles: any;
  closeModal: () => void;
};

const ArticleVehicle = ({
  articleVehicles,
  closeModal,
}: ArticleEquivalenceProps) => {
  const { t } = useTranslation();

  return (
    <div className="w-128 z-50 overflow-hidden rounded-2xl bg-[#0B0B0B] border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
        <h2 className="text-lg font-extrabold text-white">
          {t("articleApplications")}
          <span className="text-[#E10600]">.</span>
        </h2>

        <button
          onClick={closeModal}
          aria-label={t("close")}
          className="
          p-1 rounded-full
          bg-white/5 border border-white/10
          text-white
          hover:bg-[#E10600] hover:border-[#E10600]
          transition-all
        "
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabla */}
      <div className="max-h-96 overflow-y-auto hide-scrollbar">
        <table className="min-w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="py-2 px-4 text-left bg-[#0B0B0B] text-white/70 font-semibold border-b border-white/10">
                {t("brand")}
              </th>
              <th className="py-2 px-4 text-left bg-[#0B0B0B] text-white/70 font-semibold border-b border-white/10">
                {t("model")}
              </th>
              <th className="py-2 px-4 text-left bg-[#0B0B0B] text-white/70 font-semibold border-b border-white/10">
                {t("engine")}
              </th>
              <th className="py-2 px-4 text-left bg-[#0B0B0B] text-white/70 font-semibold border-b border-white/10">
                {t("year")}
              </th>
            </tr>
          </thead>

          <tbody>
            {articleVehicles &&
              Array.isArray(articleVehicles) &&
              articleVehicles.map((vehicle: any, index: number) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="border-b border-white/10 py-2 px-4 text-white">
                    {vehicle.brand}
                  </td>
                  <td className="border-b border-white/10 py-2 px-4 text-white/80">
                    {vehicle.model}
                  </td>
                  <td className="border-b border-white/10 py-2 px-4 text-white/80">
                    {vehicle.engine}
                  </td>
                  <td className="border-b border-white/10 py-2 px-4 text-white/80">
                    {vehicle.year}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Acento marca */}
      <div className="h-1 w-full bg-[#E10600] opacity-90" />
    </div>
  );
};

export default ArticleVehicle;
