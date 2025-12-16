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
    {
      id: "technical",
      icon: <GrDocumentText />,
      label: t("technicalDetailsButton"),
    },
  ];

  // Agregar botones condicionales
  if (
    Array.isArray(article.article_vehicles) &&
    article.article_vehicles.length > 0
  ) {
    buttons.push({ id: "vehicle", icon: <FaCar />, label: t("vehicleButton") });
  }
  if (
    Array.isArray(article.article_equivalence) &&
    article.article_equivalence.length > 0
  ) {
    buttons.push({
      id: "equivalences",
      icon: <GoTag />,
      label: t("equivalencesButton"),
    });
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-white/5 backdrop-blur border border-white/10 shadow-2xl">
      {/* Botones de navegación */}
      <div className="flex border-b border-white/10 bg-[#0B0B0B]">
        {buttons.map((button) => {
          const isActive = activeTable === button.id;

          return (
            <button
              key={button.id}
              onClick={() => setActiveTable(button.id)}
              title={button.label}
              className={`
              flex-1 flex justify-center items-center gap-2
              py-3
              text-sm font-bold
              transition-all duration-200
              ${
                isActive
                  ? "bg-[#E10600] text-white shadow-lg"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }
            `}
            >
              <span className="text-lg">{button.icon}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div className="p-6 bg-[#0B0B0B] min-h-[200px] text-white">
        {renderTable()}
      </div>

      {/* Acento marca */}
      <div className="h-1 w-full bg-[#E10600] opacity-90" />
    </div>
  );
};

export default Tables;
