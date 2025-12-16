"use client";
import React, { useState } from "react";
import { FaInfo } from "react-icons/fa";
import { MdAttachMoney } from "react-icons/md";
import { GoTag } from "react-icons/go";
import { GrDocumentText } from "react-icons/gr";
import TableInfo from "./TableInfo";
import TableTechnicalDetails from "./TableTechnicalDetails";
import TableEquivalences from "./TableEquivalences";

const Tables = ({ article }: any) => {
  const [activeTable, setActiveTable] = useState("info");

  const renderTable = () => {
    switch (activeTable) {
      case "info":
        return <TableInfo article={article} />;
      case "technical":
        return <TableTechnicalDetails articleId={article.id} />;
      case "equivalences":
        return <TableEquivalences articleId={article.id} />;
      default:
        return <TableInfo />;
    }
  };

  return (
    <div
      className="
      w-68 m-2
      bg-white/5 backdrop-blur
      border border-white/10
      rounded-2xl
      overflow-hidden
    "
    >
      {/* Tabs */}
      <div className="flex h-10 w-full">
        <button
          type="button"
          onClick={() => setActiveTable("info")}
          className={`
          w-1/3 flex justify-center items-center
          transition-all
          ${
            activeTable === "info"
              ? "bg-[#E10600] text-white"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }
        `}
          title="Información"
          aria-label="Información"
        >
          <FaInfo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTable("technical")}
          className={`
          w-1/3 flex justify-center items-center
          transition-all
          ${
            activeTable === "technical"
              ? "bg-[#E10600] text-white"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }
        `}
          title="Técnico"
          aria-label="Técnico"
        >
          <GrDocumentText className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTable("equivalences")}
          className={`
          w-1/3 flex justify-center items-center
          transition-all
          ${
            activeTable === "equivalences"
              ? "bg-[#E10600] text-white"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }
        `}
          title="Equivalencias"
          aria-label="Equivalencias"
        >
          <GoTag className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 border-t border-white/10">{renderTable()}</div>
    </div>
  );
};

export default Tables;
