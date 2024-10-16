"use client";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import React, { useState, useEffect } from "react";
import { FaAngleDown } from "react-icons/fa6";

const Brands = ({ onChange }: { onChange: (value: string) => void }) => {
  const [selectedBrand, setSelectedBrand] = useState("");
  const { data: brands } = useGetBrandsQuery(null);


  const handleBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedBrand(selectedValue);
    onChange(selectedValue); 
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
            <option value="">
              Select a Brand
            </option>
            {brands?.map((brand) => (
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
