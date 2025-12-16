"use client";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import React, { useState, useEffect } from "react";
import { FaAngleDown } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

const Brands = ({ onChange, brand }: any) => {
  const { t } = useTranslation();
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
    <div className="text-xs font-semibold text-white/80 px-4">
      <div className="">
        <div className="relative">
          <select
            id="brands"
            value={selectedBrand}
            onChange={handleBrandChange}
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
            {selectedBrand === "" && (
              <option value="" className="bg-zinc-900 text-white">
                {t("selectBrand")}
              </option>
            )}

            {brands?.map((brand, index) => (
              <option
                key={index}
                value={brand.id}
                className="bg-zinc-900 text-white font-semibold"
              >
                {brand.name}
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

export default Brands;
