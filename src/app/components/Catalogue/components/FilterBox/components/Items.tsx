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
    <div className="text-xs font-semibold text-white/80">
      <div className="">

        <div className="relative">
          <select
            id="items"
            value={selectedItem}
            onChange={handleItemChange}
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
            <option value="" className="bg-zinc-900 text-white/60">
              {t("selectAnItem")}
            </option>

            {items?.map((item, index) => (
              <option
                key={index}
                value={item.id}
                className="bg-zinc-900 text-white font-semibold"
              >
                {item.name}
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

export default Items;
