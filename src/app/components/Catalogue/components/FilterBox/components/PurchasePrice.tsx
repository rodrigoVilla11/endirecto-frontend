"use client";
import React from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface PurchasePriceProps {
  show: boolean;
  onToggle: (show: boolean) => void;
}

const PurchasePrice: React.FC<PurchasePriceProps> = ({ show, onToggle }) => {
  const { t } = useTranslation();

  return (
    <div className="text-xs font-semibold">
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="cart">
          {t("showPurchasePrice")}
        </label>
        <div className="flex justify-between items-center gap-2">
          <button
            onClick={() => onToggle(true)}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              show ? "bg-primary text-white" : ""
            }`}
          >
            <FaRegEye /> {t("show")}
          </button>
          <button
            onClick={() => onToggle(false)}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              !show ? "bg-primary text-white" : ""
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
