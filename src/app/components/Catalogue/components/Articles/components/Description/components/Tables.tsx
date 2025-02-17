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
        return <TableInfo />;
    }
  };

  return (
    <div className="w-68 border border-gray-200 rounded-sm m-2">
      <div className="flex h-8 w-full justify-evenly">
        <button
          className={`w-1/4 flex justify-center items-center rounded-sm ${
            activeTable === "info" ? "bg-gray-300" : ""
          }`}
          onClick={() => setActiveTable("info")}
          title={t("infoButton")}
        >
          <FaInfo />
        </button>
        <button
          className={`w-1/4 flex justify-center items-center rounded-sm ${
            activeTable === "prices" ? "bg-gray-300" : ""
          }`}
          onClick={() => setActiveTable("prices")}
          title={t("pricesButton")}
        >
          <MdAttachMoney />
        </button>
        {article.hasTechnicalDetails === true && (
          <button
            className={`w-1/4 flex justify-center items-center rounded-sm ${
              activeTable === "technical" ? "bg-gray-300" : ""
            }`}
            onClick={() => setActiveTable("technical")}
            title={t("technicalDetailsButton")}
          >
            <GrDocumentText />
          </button>
        )}
        {Array.isArray(article.article_vehicles) &&
          article.article_vehicles.length > 0 && (
            <button
              className={`w-1/4 flex justify-center items-center rounded-sm ${
                activeTable === "vehicle" ? "bg-gray-300" : ""
              }`}
              onClick={() => setActiveTable("vehicle")}
              title={t("vehicleButton")}
            >
              <FaCar />
            </button>
          )}
        <button
          className={`w-1/4 flex justify-center items-center rounded-sm ${
            activeTable === "equivalences" ? "bg-gray-300" : ""
          }`}
          onClick={() => setActiveTable("equivalences")}
          title={t("equivalencesButton")}
        >
          <GoTag />
        </button>
      </div>
      <div className="p-4">{renderTable()}</div>
    </div>
  );
};

export default Tables;
