"use client";
import { useFilters } from "@/app/context/FiltersContext";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const Stock = ({ onChange }: any) => {
  const { t } = useTranslation();
  const [selectedButton, setSelectedButton] = useState("");
  const { stock } = useFilters();

  useEffect(() => {
    // Solo se deselecciona si el valor del stock es diferente al botón seleccionado.
    if (stock !== selectedButton) {
      setSelectedButton("");
    }
  }, [stock, selectedButton]);

  const handleButtonClick = (value: string) => {
    if (selectedButton !== value) {
      setSelectedButton(value);
      onChange(value);
    } else {
      setSelectedButton("");
      onChange("");
    }
  };

  return (
    <div className="text-xs font-semibold text-white/80">
      <div className="mb-4">
        <label className="block text-white/70 font-extrabold mb-2 uppercase tracking-wide">
          {t("stock")}
        </label>

        <div className="flex gap-2">
          {/* En stock */}
          <button
            onClick={() => handleButtonClick("stock:desc")}
            className={`
            flex-1 py-2 rounded-2xl
            font-extrabold text-[10px] sm:text-xs
            border transition-all duration-200
            ${
              selectedButton === "stock:desc"
                ? "bg-emerald-500 text-white shadow-xl scale-[1.02]"
                : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
            }
          `}
          >
            {t("stock")}
          </button>

          {/* Sin stock */}
          <button
            onClick={() => handleButtonClick("stock:asc")}
            className={`
            flex-1 py-2 rounded-2xl
            font-extrabold text-[10px] sm:text-xs
            border transition-all duration-200
            ${
              selectedButton === "stock:asc"
                ? "bg-red-500 text-white shadow-xl scale-[1.02]"
                : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
            }
          `}
          >
            {t("outOfStock")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Stock;
