"use client";
import React, { useState, useEffect } from "react";
import { FaAngleDown } from "react-icons/fa6";
import { useGetItemsQuery } from "@/redux/services/itemsApi";
import { useTranslation } from "react-i18next";

const Items = ({ onChange, item }: any) => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState("");
  const { data: items } = useGetItemsQuery(null);

  // Sincronizar el estado con la prop 'item'
  useEffect(() => {
    if (!item) {
      setSelectedItem("");
    } else {
      setSelectedItem(item);
    }
  }, [item]);

  const handleItemChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedItem(selectedValue);
    onChange(selectedValue);
  };

  return (
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label
          htmlFor="items"
          className="block text-white/80 text-sm font-extrabold mb-2"
        >
          {t("items")}
        </label>

        <div className="relative flex items-center">
          <select
            id="items"
            value={selectedItem}
            onChange={handleItemChange}
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
            <option value="" className="bg-[#0B0B0B] text-white">
              {t("selectAnItem")}
            </option>

            {items?.map((item) => (
              <option
                key={item.id}
                value={item.id}
                className="bg-[#0B0B0B] text-white"
              >
                {item.name}
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

export default Items;
