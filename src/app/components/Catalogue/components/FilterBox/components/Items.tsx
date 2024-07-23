"use client";
import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa6";

const Items = () => {
  const [selectedItem, setSelectedItem] = useState("");
  const items = [
    { id: 1, name: "ACTUADORES HIDRAULICOS" },
    { id: 2, name: "AMORTIGUADOR CABINA" },
    { id: 3, name: "AMORTIGUADOR DELANTERO" },
    { id: 4, name: "AMORTIGUADOR TRASERO" },
  ];

  const handleItemChange = (event) => {
    setSelectedItem(event.target.value);
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
        <div className="flex gap-1 justify-center items-center">
          <select
            id="items"
            value={selectedItem}
            onChange={handleItemChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="" disabled>
              Select an Item
            </option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <FaAngleDown />
        </div>
      </div>
    </div>
  );
};

export default Items;
