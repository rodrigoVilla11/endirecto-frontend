"use client";
import React, { useState } from "react";
import { FaCar, FaInfo } from "react-icons/fa";
import { MdAttachMoney } from "react-icons/md";
import { GoTag } from "react-icons/go";
import { GrDocumentText } from "react-icons/gr";
import TableInfo from "./TableInfo";
import TablePrices from "./TablePrices";
import TableTechnicalDetails from "./TableTechnicalDetails";
import TableEquivalences from "./TableEquivalences";
import VehicleTable from "./TableAppOfArticles";
import { useTranslation } from "react-i18next";

const Tables = ({ article }: any) => {
  const { t } = useTranslation();
  const [activeTable, setActiveTable] = useState("info");

  const renderTable = () => {
    switch (activeTable) {
      case "info":
        return <TableInfo article={article} />;
      case "prices":
        return <TablePrices article={article} />;
      case "technical":
        return <TableTechnicalDetails articleId={article.id} />;
      case "vehicle":
        return <VehicleTable vehicles={article.article_vehicles} />;
      case "equivalences":
        return <TableEquivalences articleId={article.id} />;
      default:
        return <TableInfo article={article} />;
    }
  };

  const buttons = [
    { id: "info", icon: <FaInfo />, label: t("infoButton") },
    { id: "prices", icon: <MdAttachMoney />, label: t("pricesButton") },
    { id: "technical", icon: <GrDocumentText />, label: t("technicalDetailsButton") },
  ];

  // Agregar botones condicionales
  if (Array.isArray(article.article_vehicles) && article.article_vehicles.length > 0) {
    buttons.push({ id: "vehicle", icon: <FaCar />, label: t("vehicleButton") });
  }
  if (Array.isArray(article.article_equivalence) && article.article_equivalence.length > 0) {
    buttons.push({ id: "equivalences", icon: <GoTag />, label: t("equivalencesButton") });
  }

  return (
    <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Botones de navegación */}
      <div className="flex bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200">
        {buttons.map((button) => (
          <button
            key={button.id}
            className={`flex-1 flex justify-center items-center py-3 transition-all duration-200 ${
              activeTable === button.id
                ? "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTable(button.id)}
            title={button.label}
          >
            <span className="text-lg">{button.icon}</span>
          </button>
        ))}
      </div>

      {/* Contenido de la tabla */}
      <div className="p-6 bg-white min-h-[200px]">
        {renderTable()}
      </div>
    </div>
  );
};

export default Tables;