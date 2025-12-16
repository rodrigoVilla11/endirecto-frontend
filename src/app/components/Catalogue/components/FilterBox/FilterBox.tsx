"use client";
import React from "react";
import { useFilters } from "@/app/context/FiltersContext";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useTranslation } from "react-i18next";
import {
  useGetArticleVehicleBrandsQuery,
  useGetArticleVehicleModelsQuery,
  useGetArticleVehicleEnginesQuery,
  useGetArticleVehicleYearsQuery,
} from "@/redux/services/articlesVehicles";

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

  // === QUERIES (hooks SIEMPRE al tope, sin condicionales) ===
  const { data: brandsData = [], isLoading: isLoadingBrands } =
    useGetArticleVehicleBrandsQuery(null, {
      skip: !isVisible, // opcional, para no pedir si está cerrado
    });

  const { data: modelsData = [], isLoading: isLoadingModels } =
    useGetArticleVehicleModelsQuery(
      { brand: vehicleBrand },
      { skip: !isVisible || !vehicleBrand }
    );

  const { data: enginesData = [], isLoading: isLoadingEngines } =
    useGetArticleVehicleEnginesQuery(
      { brand: vehicleBrand },
      { skip: !isVisible || !vehicleBrand }
    );

  const { data: yearsData = [], isLoading: isLoadingYears } =
    useGetArticleVehicleYearsQuery(
      { brand: vehicleBrand, model },
      { skip: !isVisible || !vehicleBrand || !model }
    );

  // ⬇️ recien ahora el early return
  if (!isVisible) return null;

  // === HANDLERS ===
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setVehicleBrand(value);
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

  const hasActiveFilters = !!(vehicleBrand || model || engine || year);

  return (
    <div
      className="
    w-full
    bg-white/5 backdrop-blur-xl
    rounded-3xl p-3 md:p-4
    shadow-2xl
    border border-white/10
  "
    >
      <div className="flex flex-col gap-3">
        {/* Primera fila */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs md:text-sm font-extrabold text-white/70 uppercase whitespace-nowrap tracking-wide">
            {t("vehicleFilters") || "FILTRAR POR VEHICULO"}
          </span>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[10px] md:text-xs font-bold text-[#E10600] hover:text-white transition-colors"
              >
                {"Limpiar filtros"}
              </button>
            )}

            <span className="text-xs md:text-sm font-semibold text-white/60 whitespace-nowrap">
              {t("results", { count: totalResults })}
            </span>
          </div>
        </div>

        {/* Segunda fila: Selectores */}
        <div
          className={`grid ${
            isMobile ? "grid-cols-2" : "grid-cols-4"
          } gap-2 md:gap-3`}
        >
          {/* Marca */}
          <div>
            <select
              value={vehicleBrand}
              onChange={handleBrandChange}
              disabled={isLoadingBrands}
              className={`
              w-full px-3 py-2 rounded-2xl
              border border-white/10
              bg-black/30 text-xs md:text-sm font-semibold text-white
              focus:outline-none focus:ring-2 focus:ring-[#E10600]/25
              ${
                isLoadingBrands
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:border-[#E10600]/40"
              }
            `}
            >
              <option value="">
                {isLoadingBrands
                  ? t("loading") || "Cargando..."
                  : t("vehicleBrands") || "MARCA"}
              </option>
              {brandsData.map((b, idx) => (
                <option key={`${b}-${idx}`} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Modelo */}
          <div>
            <select
              value={model}
              onChange={handleModelChange}
              disabled={!vehicleBrand || isLoadingModels}
              className={`
              w-full px-3 py-2 rounded-2xl
              border border-white/10
              bg-black/30 text-xs md:text-sm font-semibold text-white
              focus:outline-none focus:ring-2 focus:ring-[#E10600]/25
              ${
                !vehicleBrand || isLoadingModels
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:border-[#E10600]/40"
              }
            `}
            >
              <option value="">
                {isLoadingModels
                  ? t("loading") || "Cargando..."
                  : t("vehicleModels") || "MODELO"}
              </option>
              {modelsData.map((m, idx) => (
                <option key={`${m}-${idx}`} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Motor */}
          <div>
            <select
              value={engine}
              onChange={handleEngineChange}
              disabled={!vehicleBrand || isLoadingEngines}
              className={`
              w-full px-3 py-2 rounded-2xl
              border border-white/10
              bg-black/30 text-xs md:text-sm font-semibold text-white
              focus:outline-none focus:ring-2 focus:ring-[#E10600]/25
              ${
                !vehicleBrand || isLoadingEngines
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:border-[#E10600]/40"
              }
            `}
            >
              <option value="">
                {isLoadingEngines
                  ? t("loading") || "Cargando..."
                  : t("vehicleEngines") || "MOTOR"}
              </option>
              {enginesData.map((e, idx) => (
                <option key={`${e}-${idx}`} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          {/* Año */}
          <div>
            <select
              value={year}
              onChange={handleYearChange}
              disabled={!vehicleBrand || !model || isLoadingYears}
              className={`
              w-full px-3 py-2 rounded-2xl
              border border-white/10
              bg-black/30 text-xs md:text-sm font-semibold text-white
              focus:outline-none focus:ring-2 focus:ring-[#E10600]/25
              ${
                !vehicleBrand || !model || isLoadingYears
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:border-[#E10600]/40"
              }
            `}
            >
              <option value="">
                {isLoadingYears
                  ? t("loading") || "Cargando..."
                  : t("vehicleYears") || "AÑO"}
              </option>
              {yearsData.map((y, idx) => (
                <option key={`${y}-${idx}`} value={y}>
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
