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
    <div className="text-xs font-semibold">
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="stock">
          {t("stock")}
        </label>
        <div className="flex justify-between items-center gap-1">
          <button
            onClick={() => handleButtonClick("stock:desc")}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              selectedButton === "stock:desc" ? "bg-primary text-white" : ""
            }`}
          >
            {t("stock")}
          </button>
          <button
            onClick={() => handleButtonClick("stock:asc")}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              selectedButton === "stock:asc" ? "bg-primary text-white" : ""
            }`}
          >
            {t("outOfStock")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Stock;
