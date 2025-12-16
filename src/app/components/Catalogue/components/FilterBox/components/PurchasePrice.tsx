"use client";
import React, { useEffect, useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/context/AuthContext";
import { useUpdateCustomerMutation } from "@/redux/services/customersApi";

interface PurchasePriceProps {
  show: boolean;
  onToggle: (show: boolean) => void;
}

const PurchasePrice: React.FC<PurchasePriceProps> = ({ show, onToggle }) => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const [updateCustomer] = useUpdateCustomerMutation();
  const [localShow, setLocalShow] = useState<boolean | null>(null); // null para diferenciar aún no cargado

  useEffect(() => {
    if (userData?.showCostPrice === false) {
      setLocalShow(false);
    } else {
      setLocalShow(true); // true o undefined → true por defecto
    }
  }, [userData?.showCostPrice]);

  const handleToggle = async (value: boolean) => {
    setLocalShow(value);
    onToggle(value);

    if (userData) {
      try {
        await updateCustomer({
          id: userData._id,
          showCostPrice: value,
        }).unwrap();
      } catch (error) {
        console.error("Error updating customer showCostPrice:", error);
      }
    }
  };

  if (localShow === null) return null; // opcional: evitar parpadeo visual antes de tener datos

  return (
    <div className="text-xs font-semibold text-white/80">
      <div className="mb-4">
        <label className="block text-white/70 font-extrabold mb-2 uppercase tracking-wide">
          {t("showPurchasePrice")}
        </label>

        <div className="flex gap-2">
          {/* Mostrar */}
          <button
            onClick={() => handleToggle(true)}
            className={`
            flex-1 py-2 rounded-2xl
            flex items-center justify-center gap-2
            font-extrabold text-[10px] sm:text-xs
            border transition-all duration-200
            ${
              localShow
                ? "bg-emerald-500 text-white shadow-xl scale-[1.02]"
                : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
            }
          `}
          >
            <FaRegEye className="text-sm" />
            {t("show")}
          </button>

          {/* Ocultar */}
          <button
            onClick={() => handleToggle(false)}
            className={`
            flex-1 py-2 rounded-2xl
            flex items-center justify-center gap-2
            font-extrabold text-[10px] sm:text-xs
            border transition-all duration-200
            ${
              !localShow
                ? "bg-red-500 text-white shadow-xl scale-[1.02]"
                : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
            }
          `}
          >
            <FaRegEyeSlash className="text-sm" />
            {t("hide")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchasePrice;
