"use client";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import React, { useState, useEffect } from "react";
import { FaAngleDown } from "react-icons/fa6";

const Brands = ({ onChange, brand }: any) => {
  const [selectedBrand, setSelectedBrand] = useState("");
  const { data: brands } = useGetBrandsQuery(null);

  // Actualiza el estado cuando la prop 'brand' cambie
  useEffect(() => {
    if (brand) {
      setSelectedBrand(brand); // Si 'brand' tiene un valor, asignalo al estado
    } else {
      setSelectedBrand(""); // Si 'brand' es falsy, resetea el estado a ""
    }
  }, [brand]);

  const handleBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedBrand(selectedValue);
    onChange(selectedValue); // Actualiza el estado global
  };

  return (
    <div className="text-xs font-semibold">
      <div className="mb-4">
        <label
          className="block text-gray-700 font-bold mb-2"
          htmlFor="brands"
        >
          Brands
        </label>
        <div className="relative flex gap-1 justify-center items-center">
          <select
            id="brands"
            value={selectedBrand}
            onChange={handleBrandChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {selectedBrand === "" && <option value="">Select a Brand</option>}
            {brands?.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <FaAngleDown className="absolute right-3 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default Brands;
