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
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label
          htmlFor="showPurchasePrice"
          className="block text-white/80 text-sm font-extrabold mb-2"
        >
          {t("showPurchasePrice")}
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleShowPrice(true)}
            className={`
            w-1/2
            flex items-center justify-center gap-2
            py-2 rounded-xl
            border
            font-bold text-sm
            transition-all duration-200
            ${
              showPrice
                ? "bg-[#E10600] text-white border-[#E10600]"
                : "bg-white/5 text-white/70 border-white/10 hover:border-[#E10600]/40 hover:bg-white/10"
            }
          `}
          >
            <FaRegEye className="w-4 h-4" />
            {t("show")}
          </button>

          <button
            type="button"
            onClick={() => handleShowPrice(false)}
            className={`
            w-1/2
            flex items-center justify-center gap-2
            py-2 rounded-xl
            border
            font-bold text-sm
            transition-all duration-200
            ${
              !showPrice
                ? "bg-[#E10600] text-white border-[#E10600]"
                : "bg-white/5 text-white/70 border-white/10 hover:border-[#E10600]/40 hover:bg-white/10"
            }
          `}
          >
            <FaRegEyeSlash className="w-4 h-4" />
            {t("hide")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchasePrice;
