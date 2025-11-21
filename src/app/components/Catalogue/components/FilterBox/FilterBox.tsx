"use client";
import React from "react";
import { useFilters } from "@/app/context/FiltersContext";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useTranslation } from "react-i18next";

interface FilterBoxProps {
  isVisible: boolean;
  onClose: () => void;
  totalResults: number;
}

const FilterBox = ({ isVisible, onClose, totalResults }: FilterBoxProps) => {
  const { t } = useTranslation();
  const {
    setVehicleBrand,
    vehicleBrand,
    setModel,
    model,
    setEngine,
    engine,
    setYear,
    year,
  } = useFilters();
  const { isMobile } = useMobile();

  if (!isVisible) return null;

  // DATOS HARDCODEADOS - Opciones de ejemplo
  const brands = ["FORD", "CHEVROLET", "VOLKSWAGEN", "FIAT", "RENAULT"];
  const models = ["FOCUS", "FIESTA", "MONDEO", "RANGER"];
  const engines = ["1.6", "2.0", "2.5", "3.0"];
  const years = ["2020", "2021", "2022", "2023", "2024"];

  return (
    <div className="w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl p-3 md:p-4 shadow-lg">
      <div className="flex flex-col gap-3">
        {/* Primera fila: Título y contador */}
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-bold text-gray-700 uppercase whitespace-nowrap">
            FILTRAR
          </span>
          <span className="text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
            {totalResults.toLocaleString()} resultados
          </span>
        </div>

        {/* Segunda fila: Selectores */}
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-2 md:gap-3`}>
          {/* Marca de vehículo */}
          <div>
            <select
              value={vehicleBrand}
              onChange={(e) => setVehicleBrand(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">MARCA</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Modelo */}
          <div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">MODELO</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Motor */}
          <div>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">MOTOR</option>
              {engines.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          {/* Año */}
          <div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">AÑO</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBox;