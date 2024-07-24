"use client";
import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa6";

const Brands = () => {
  const [selectedBrand, setSelectedBrand] = useState("");
  const brands = [
    { id: 1, name: "CHAO YANG" },
    { id: 2, name: "CORVEN" },
    { id: 3, name: "CORVEN TIRES" },
    { id: 4, name: "CTR" },
  ];

  const handleBrandChange = (event : any) => {
    setSelectedBrand(event.target.value);
  };

  return (
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="brands"
        >
          Brands
        </label>
        <div className="flex gap-1 justify-center items-center">
          <select
            id="brands"
            value={selectedBrand}
            onChange={handleBrandChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="" disabled>
              Select a Brand
            </option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <FaAngleDown />
        </div>
      </div>
    </div>
  );
};

export default Brands;
