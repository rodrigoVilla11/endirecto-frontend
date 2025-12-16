"use client";
import React from "react";
import { FaTrashCan } from "react-icons/fa6";
import { X, Filter, XCircle } from "lucide-react";
import Brands from "./components/Brands";
import Items from "./components/Items";
import VehiclesBrands from "./components/VehiclesBrands";
import { useFilters } from "@/app/context/FiltersContext";
import { useTranslation } from "react-i18next";

const FilterBox = ({ isVisible, onClose }: any) => {
  const { t } = useTranslation();
  const {
    setTags,
    tags,
    setBrand,
    brand,
    setItem,
    item,
    setVehicleBrand,
    vehicleBrand,
  } = useFilters();

  const activeFilters = [
    { label: tags, clear: () => setTags(""), show: tags.length > 0 },
    { label: brand, clear: () => setBrand(""), show: brand && brand !== "" },
    { label: item, clear: () => setItem(""), show: item && item !== "" },
    {
      label: vehicleBrand,
      clear: () => setVehicleBrand(""),
      show: vehicleBrand && vehicleBrand !== "",
    },
  ].filter((f) => f.show);

  const clearAllFilters = () => {
    setTags("");
    setBrand("");
    setItem("");
    setVehicleBrand("");
  };

  return (
    <>
      {isVisible && (
        <div className="w-80 lg:w-96 h-fit sticky top-24 bg-[#0B0B0B] rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="bg-[#0B0B0B] p-6 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#E10600]/10 border border-[#E10600]/25">
                <Filter className="w-6 h-6 text-[#E10600]" />
              </div>
              <h2 className="text-xl font-extrabold text-white">
                {t("filters") || "Filtros"}
                <span className="text-[#E10600]">.</span>
              </h2>
            </div>

            <button
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2 transition-all"
              aria-label={t("close") || "Cerrar"}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filtros aplicados */}
          {activeFilters.length > 0 && (
            <div className="p-6 bg-white/5 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-[#E10600] rounded-full animate-pulse" />
                  {t("filtersApplied") || "Filtros Aplicados"}
                </h3>

                <button
                  onClick={clearAllFilters}
                  className="
                  text-xs font-extrabold
                  text-white
                  bg-[#E10600] hover:bg-[#c80500]
                  px-3 py-1.5 rounded-xl
                  transition-all flex items-center gap-2
                "
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {t("clearAll") || "Limpiar todo"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="
                    group relative inline-flex items-center gap-2
                    bg-white/5 border border-white/10
                    rounded-2xl px-3 py-2
                    hover:border-[#E10600]/40 hover:bg-white/10
                    transition-all
                  "
                  >
                    <span className="text-sm font-semibold text-white/80 max-w-[140px] truncate">
                      {filter.label}
                    </span>
                    <button
                      onClick={filter.clear}
                      className="
                      text-white/70 hover:text-white
                      hover:bg-[#E10600]/15
                      rounded-xl p-1.5 transition-all
                    "
                      title={t("remove") || "Eliminar"}
                      aria-label={t("remove") || "Eliminar"}
                    >
                      <FaTrashCan className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contenido de filtros */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-[#E10600]/40 transition-colors">
                <Brands onChange={setBrand} brand={brand} />
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-[#E10600]/40 transition-colors">
                <Items onChange={setItem} item={item} />
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-[#E10600]/40 transition-colors">
                <VehiclesBrands />
              </div>
            </div>
          </div>

          {/* Footer con contador */}
          {activeFilters.length > 0 && (
            <div className="p-4 bg-white/5 border-t border-white/10">
              <div className="flex items-center justify-between text-white">
                <span className="text-sm font-semibold text-white/80">
                  {t("activeFiltersCount") || "Filtros activos"}
                </span>
                <span className="px-3 py-1 bg-[#E10600] text-white rounded-full font-extrabold text-sm">
                  {activeFilters.length}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FilterBox;
