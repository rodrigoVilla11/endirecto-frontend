"use client";
import React, { useState, useEffect } from "react";
import { FaAngleDown } from "react-icons/fa6";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useTranslation } from "react-i18next";

const Brands = ({ onChange, brand }: any) => {
  const { t } = useTranslation();
  const [selectedBrand, setSelectedBrand] = useState("");
  const { data: brands } = useGetBrandsQuery(null);

  // Actualiza el estado cuando la prop 'brand' cambie
  useEffect(() => {
    if (brand) {
      setSelectedBrand(brand);
    } else {
      setSelectedBrand("");
    }
  }, [brand]);

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
          {t("brands")}
        </label>
        <div className="relative flex gap-1 justify-center items-center">
          <select
            id="brands"
            value={selectedBrand}
            onChange={handleBrandChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {selectedBrand === "" && <option value="">{t("selectABrand")}</option>}
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
