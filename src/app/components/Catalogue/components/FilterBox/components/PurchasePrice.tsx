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
         showCostPrice: value ,
        }).unwrap();
      } catch (error) {
        console.error("Error updating customer showCostPrice:", error);
      }
    }
  };

  if (localShow === null) return null; // opcional: evitar parpadeo visual antes de tener datos

  return (
    <div className="text-xs font-semibold">
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="cart">
          {t("showPurchasePrice")}
        </label>
        <div className="flex justify-between items-center gap-2">
          <button
            onClick={() => handleToggle(true)}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              localShow ? "bg-primary text-white" : ""
            }`}
          >
            <FaRegEye /> {t("show")}
          </button>
          <button
            onClick={() => handleToggle(false)}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              !localShow ? "bg-primary text-white" : ""
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
