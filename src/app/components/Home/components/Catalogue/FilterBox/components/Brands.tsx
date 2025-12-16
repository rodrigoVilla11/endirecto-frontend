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
          htmlFor="brands"
          className="block text-white/80 text-sm font-extrabold mb-2"
        >
          {t("brands")}
        </label>

        <div className="relative flex items-center">
          <select
            id="brands"
            value={selectedBrand}
            onChange={handleBrandChange}
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
            {selectedBrand === "" && (
              <option value="" className="bg-[#0B0B0B] text-white">
                {t("selectABrand")}
              </option>
            )}

            {brands?.map((brand) => (
              <option
                key={brand.id}
                value={brand.id}
                className="bg-[#0B0B0B] text-white"
              >
                {brand.name}
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

export default Brands;
