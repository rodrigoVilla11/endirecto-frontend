import React from "react";
import { useTranslation } from "react-i18next";

export default function VehicleTable({ vehicles }: any) {
  const { t } = useTranslation();

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center text-white/60 py-8 italic">
        <p>{t("noVehicles")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-2xl">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="py-3 px-4 text-left font-bold text-white/70 bg-[#0B0B0B] border-b border-white/10">
              {t("brand")}
            </th>
            <th className="py-3 px-4 text-left font-bold text-white/70 bg-[#0B0B0B] border-b border-white/10">
              {t("model")}
            </th>
            <th className="py-3 px-4 text-left font-bold text-white/70 bg-[#0B0B0B] border-b border-white/10">
              {t("engine")}
            </th>
            <th className="py-3 px-4 text-left font-bold text-white/70 bg-[#0B0B0B] border-b border-white/10">
              {t("year")}
            </th>
          </tr>
        </thead>

        <tbody>
          {vehicles.map((vehicle: any, index: number) => (
            <tr
              key={index}
              className={`
              border-b border-white/10
              transition-colors
              ${index % 2 === 0 ? "bg-white/0" : "bg-white/5"}
              hover:bg-white/10
            `}
            >
              <td className="py-3 px-4 text-white">{vehicle.brand}</td>
              <td className="py-3 px-4 text-white/80">{vehicle.model}</td>
              <td className="py-3 px-4 text-white/80">{vehicle.engine}</td>
              <td className="py-3 px-4 text-white/80">{vehicle.year}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Acento marca */}
      <div className="h-1 w-full bg-[#E10600] opacity-90" />
    </div>
  );
}
