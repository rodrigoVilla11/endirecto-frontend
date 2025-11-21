import React from "react";
import { useTranslation } from "react-i18next";

export default function VehicleTable({ vehicles }: any) {
  const { t } = useTranslation();

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>{t("noVehicles")}</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
            <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">{t("brand")}</th>
            <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">{t("model")}</th>
            <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">{t("engine")}</th>
            <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">{t("year")}</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle: any, index: number) => (
            <tr
              key={index}
              className={`border-t border-gray-200 hover:bg-gradient-to-r hover:from-pink-50 hover:via-purple-50 hover:to-blue-50 transition-colors ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <td className="py-3 px-4 text-sm text-gray-700">{vehicle.brand}</td>
              <td className="py-3 px-4 text-sm text-gray-700">{vehicle.model}</td>
              <td className="py-3 px-4 text-sm text-gray-700">{vehicle.engine}</td>
              <td className="py-3 px-4 text-sm text-gray-700">{vehicle.year}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}