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
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="order"
        >
          {t("order")}
        </label>
        <div className="flex gap-1 justify-center items-center">
          <select
            id="order"
            value={selectedOrder}
            onChange={handleOrderChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {orders.map((option) => (
              <option key={option.id} value={option.id}>
                {t(option.name)}
              </option>
            ))}
          </select>
          <FaAngleDown />
        </div>
      </div>
    </div>
  );
};

export default Order;
