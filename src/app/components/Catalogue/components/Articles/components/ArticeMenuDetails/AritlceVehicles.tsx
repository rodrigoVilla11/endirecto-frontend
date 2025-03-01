import React from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

type ArticleEquivalenceProps = {
  articleVehicles: any;
  closeModal: () => void;
};

const ArticleVehicle = ({ articleVehicles, closeModal }: ArticleEquivalenceProps) => {
  const { t } = useTranslation();

  return (
    <div className="w-128 z-50">
      <div className="flex items-center justify-between p-4 bg-gray-100 rounded-t-lg">
        <h2 className="text-lg font-medium">{t("articleApplications")}</h2>
        <button
          onClick={closeModal}
          className="p-1 hover:bg-gray-200 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <table className="min-w-full bg-white">
        <thead>
          <tr className="text-xs">
            <th className="py-2 px-4 bg-gray-200 text-left">{t("brand")}</th>
            <th className="py-2 px-4 bg-gray-200 text-left">{t("engine")}</th>
            <th className="py-2 px-4 bg-gray-200 text-left">{t("model")}</th>
            <th className="py-2 px-4 bg-gray-200 text-left">{t("year")}</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {articleVehicles &&
            Array.isArray(articleVehicles) &&
            articleVehicles.map((vehicle: any, index: any) => (
              <tr key={index} className="border-b">
                <td className="border-t py-2 px-4">{vehicle.brand}</td>
                <td className="border-t py-2 px-4">{vehicle.engine}</td>
                <td className="border-t py-2 px-4">{vehicle.model}</td>
                <td className="border-t py-2 px-4">{vehicle.year}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArticleVehicle;
