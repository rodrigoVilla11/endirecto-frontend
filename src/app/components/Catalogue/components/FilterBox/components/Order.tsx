'use client';
import React, { useState } from 'react';
import { FaAngleDown } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

const Order = ({ onChange }: any) => {
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState("stock:desc");

  const orderOptions = [
    { id: "stock:desc", name: t("bestSellers") },
    { id: "brand:asc", name: t("byBrands") },
    { id: "code:asc", name: t("byCode") },
    { id: "price:asc", name: t("lowerPrice") },
    { id: "price:desc", name: t("higherPrice") },
    { id: "stock:desc", name: t("stock") },
  ];

  const handleOrderChange = (event: any) => {
    setSelectedOrder(event.target.value);
    onChange(event.target.value);
  };

  return (
    <div className="text-xs font-semibold">
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="order">
          {t("order")}
        </label>
        <div className="relative flex gap-1 justify-center items-center">
          <select
            id="order"
            value={selectedOrder}
            onChange={handleOrderChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {orderOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <FaAngleDown className="absolute right-3 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default Order;
