"use client";
import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const PurchasePrice = ({ onToggle }: { onToggle: (show: boolean) => void }) => {
  const { t } = useTranslation();
  const [showPrice, setShowPrice] = useState(true);

  const handleShowPrice = (value: boolean) => {
    setShowPrice(value);
    onToggle(value);
  };

  return (
    <div className="text-xs font-semibold">
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="cart">
          {t("showPurchasePrice")}
        </label>
        <div className="flex justify-between items-center gap-2">
          <button
            onClick={() => handleShowPrice(true)}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              showPrice ? "bg-primary text-white" : ""
            }`}
          >
            <FaRegEye /> {t("show")}
          </button>
          <button
            onClick={() => handleShowPrice(false)}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              !showPrice ? "bg-primary text-white" : ""
            }`}
          >
            <FaRegEyeSlash /> {t("hide")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchasePrice;
