"use client";
import React from "react";
import { FaAngleDown } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import {
  useGetArticleVehicleBrandsQuery,
  useGetArticleVehicleModelsQuery,
  useGetArticleVehicleEnginesQuery,
  useGetArticleVehicleYearsQuery,
} from "@/redux/services/articlesVehicles";
import { useFilters } from "@/app/context/FiltersContext";

const VehicleFilter = () => {
  const { t } = useTranslation();
  const {
    vehicleBrand,
    setVehicleBrand,
    model,
    setModel,
    engine,
    setEngine,
    year,
    setYear,
  } = useFilters();

  // Consultas (dependen del contexto)
  const { data: brandsData = [], isLoading: isLoadingBrands } =
    useGetArticleVehicleBrandsQuery(null);
  const { data: modelsData = [], isLoading: isLoadingModels } =
    useGetArticleVehicleModelsQuery(
      { brand: vehicleBrand },
      { skip: !vehicleBrand }
    );
  const { data: enginesData = [], isLoading: isLoadingEngines } =
    useGetArticleVehicleEnginesQuery(
      { brand: vehicleBrand },
      { skip: !vehicleBrand }
    );
  const { data: yearsData = [], isLoading: isLoadingYears } =
    useGetArticleVehicleYearsQuery(
      { brand: vehicleBrand, model },
      { skip: !vehicleBrand || !model }
    );

  // Cada vez que se actualice alguno de estos valores, se notifican (si fuera necesario)
  // Aquí el componente es "controlado" por el contexto

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setVehicleBrand(value);
    // Al cambiar la marca, se limpian los dependientes
    setModel("");
    setEngine("");
    setYear("");
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setModel(value);
    setYear("");
  };

  const handleEngineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setEngine(value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setYear(value);
  };

  const handleClearFilters = () => {
    setVehicleBrand("");
    setModel("");
    setEngine("");
    setYear("");
  };

  return (
    <div className="text-xs font-semibold text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-extrabold text-sm text-white">
          {t("vehicleFilters")}
          <span className="text-[#E10600]">.</span>
        </h3>

        {(vehicleBrand || model || engine || year) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="
            text-xs font-extrabold
            text-white/80
            hover:text-white
            bg-white/5 border border-white/10
            px-3 py-1.5 rounded-xl
            hover:border-[#E10600]/40 hover:bg-[#E10600]/10
            transition-all
          "
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      <FilterDropdown
        label={t("vehicleBrands")}
        value={vehicleBrand}
        onChange={handleBrandChange}
        options={brandsData}
        placeholder={t("selectVehicleBrands")}
        isLoading={isLoadingBrands}
      />

      <FilterDropdown
        label={t("vehicleModels")}
        value={model}
        onChange={handleModelChange}
        options={modelsData}
        placeholder={t("selectVehicleModels")}
        isLoading={isLoadingModels}
        disabled={!vehicleBrand}
      />

      <FilterDropdown
        label={t("vehicleEngines")}
        value={engine}
        onChange={handleEngineChange}
        options={enginesData}
        placeholder={t("selectVehicleEngines")}
        isLoading={isLoadingEngines}
        disabled={!vehicleBrand}
      />

      <FilterDropdown
        label={t("vehicleYears")}
        value={year}
        onChange={handleYearChange}
        options={yearsData}
        placeholder={t("selectVehicleYears")}
        isLoading={isLoadingYears}
        disabled={!vehicleBrand || !model}
      />
    </div>
  );
};

const FilterDropdown = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  isLoading = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder: string;
  isLoading?: boolean;
  disabled?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-gray-700 font-bold mb-2">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled || isLoading}
        className={`shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : ""
        }`}
      >
        <option value="">{isLoading ? "Cargando..." : placeholder}</option>
        {options.map((option, index) => (
          <option key={`${option}-${index}`} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-3 pointer-events-none">
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        ) : (
          <FaAngleDown className="text-gray-400" />
        )}
      </div>
    </div>
  </div>
);

export default VehicleFilter;
