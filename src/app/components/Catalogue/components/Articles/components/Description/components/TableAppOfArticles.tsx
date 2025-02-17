import React from "react";
import { useTranslation } from "react-i18next";

export default function VehicleTable({ vehicles }: any) {
  const { t } = useTranslation();
  
  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr className="text-xs">
          <th className="py-2 bg-gray-200 text-left">{t("brand")}</th>
          <th className="py-2 bg-gray-200 text-left">{t("model")}</th>
          <th className="py-2 bg-gray-200 text-left">{t("engine")}</th>
          <th className="py-2 bg-gray-200 text-left">{t("year")}</th>
        </tr>
      </thead>
      <tbody className="text-xs">
        {vehicles.map((vehicle: any, index: any) => (
          <tr
            key={index}
            className={`border-b last:border-b-0 ${
              index % 2 === 0 ? "bg-white" : "bg-gray-50"
            }`}
          >
            <td className="border-t py-2">{vehicle.brand}</td>
            <td className="border-t py-2">{vehicle.model}</td>
            <td className="border-t py-2">{vehicle.engine}</td>
            <td className="border-t py-2">{vehicle.year}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
