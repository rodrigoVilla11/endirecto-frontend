"use client";
import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

const Order = ({ onChange }: any) => {
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState("stock:desc");

  const orderOptions = [
    { id: "stock:desc", name: t("bestSellers") },
    { id: "brand:asc", name: t("byBrands") },
    { id: "supplier_code:asc", name: t("byCode") },
    { id: "price:asc", name: t("lowerPrice") },
    { id: "price:desc", name: t("higherPrice") },
    { id: "stock:desc", name: t("stock") },
  ];

  const handleOrderChange = (event: any) => {
    setSelectedOrder(event.target.value);
    onChange(event.target.value);
  };

  return (
    <div className="text-xs font-semibold text-white/80">
      <div className="mb-4">
        <label className="block text-white/70 font-extrabold mb-2 uppercase tracking-wide">
          {t("order")}
        </label>

        <div className="relative">
          <select
            id="order"
            value={selectedOrder}
            onChange={handleOrderChange}
            className="
            w-full
            appearance-none
            rounded-2xl
            px-4 py-2
            bg-white/10
            border border-white/20
            text-white font-bold text-xs
            backdrop-blur
            shadow-lg
            transition-all duration-200
            hover:bg-white/20
            focus:outline-none
            focus:ring-2 focus:ring-purple-400
          "
          >
            {orderOptions.map((option, index) => (
              <option
                key={index}
                value={option.id}
                className="bg-zinc-900 text-white font-semibold"
              >
                {option.name}
              </option>
            ))}
          </select>

          {/* Icono */}
          <FaAngleDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default Order;
