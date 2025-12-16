"use client";
import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

const Order = ({ onChange }: any) => {
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState(1);
  const orders = [
    { id: 1, name: "bestSellers" },
    { id: 2, name: "byBrands" },
    { id: 3, name: "byCode" },
    { id: 4, name: "lowerPrice" },
    { id: 5, name: "higherPrice" },
    { id: 6, name: "stock" },
  ];

  const handleOrderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value, 10);
    setSelectedOrder(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label
          htmlFor="order"
          className="block text-white/80 text-sm font-extrabold mb-2"
        >
          {t("order")}
        </label>

        <div className="relative flex items-center">
          <select
            id="order"
            value={selectedOrder}
            onChange={handleOrderChange}
            className="
            w-full
            bg-white/5
            border border-white/10
            rounded-xl
            py-2.5 pl-3 pr-10
            text-white
            text-sm
            font-semibold
            appearance-none
            transition-all duration-200
            focus:outline-none
            focus:border-[#E10600]/60
            focus:ring-2 focus:ring-[#E10600]/30
            hover:border-[#E10600]/40
          "
          >
            {orders.map((option) => (
              <option
                key={option.id}
                value={option.id}
                className="bg-[#0B0B0B] text-white"
              >
                {t(option.name)}
              </option>
            ))}
          </select>

          {/* Chevron */}
          <FaAngleDown className="absolute right-3 text-white/60 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default Order;
