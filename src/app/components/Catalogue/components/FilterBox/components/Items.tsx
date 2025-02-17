"use client";
import { useGetItemsQuery } from "@/redux/services/itemsApi";
import React, { useState, useEffect } from "react";
import { FaAngleDown } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

const Items = ({ onChange, item }: any) => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState("");
  const { data: items } = useGetItemsQuery(null);

  // Sincronizar el estado con la prop 'item'
  useEffect(() => {
    if (!item) {
      setSelectedItem(""); // Si 'item' es falsy, resetea el estado
    } else {
      setSelectedItem(item); // Si 'item' tiene un valor, asignarlo al estado
    }
  }, [item]);

  const handleItemChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedItem(selectedValue); // Actualiza el estado
    onChange(selectedValue); // Llama a onChange con el nuevo valor
  };

  return (
    <div className="text-xs font-semibold">
      <div className="mb-4">
        <label
          className="block text-gray-700 font-bold mb-2"
          htmlFor="items"
        >
          {t("items")}
        </label>
        <div className="relative flex gap-1 justify-center items-center">
          <select
            id="items"
            value={selectedItem}
            onChange={handleItemChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">{t("selectAnItem")}</option>
            {items?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <FaAngleDown className="absolute right-3 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default Items;
