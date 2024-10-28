"use client";
import { useGetItemsQuery } from "@/redux/services/itemsApi";
import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa6";

const Items = ({onChange} : any) => {
  const [selectedItem, setSelectedItem] = useState("");
  const { data: items } = useGetItemsQuery(null);


  const handleItemChange = (event : React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedItem(event.target.value);
    onChange(selectedValue); 
  };

  return (
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="items"
        >
          Items
        </label>
        <div className="relative flex gap-1 justify-center items-center">
          <select
            id="items"
            value={selectedItem}
            onChange={handleItemChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">
              Select an Item
            </option>
            {items?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <FaAngleDown className="absolute right-3 pointer-events-none"/>
        </div>
      </div>
    </div>
  );
};

export default Items;
