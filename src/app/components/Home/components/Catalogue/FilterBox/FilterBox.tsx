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
    { label: vehicleBrand, clear: () => setVehicleBrand(""), show: vehicleBrand && vehicleBrand !== "" },
  ].filter(f => f.show);

  const clearAllFilters = () => {
    setTags("");
    setBrand("");
    setItem("");
    setVehicleBrand("");
  };

  return (
    <>
      {isVisible && (
        <div className="w-80 lg:w-96 h-fit sticky top-24 bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 via-white to-blue-500 p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Filter className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">
                {t("filters") || "Filtros"}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filtros aplicados */}
          {activeFilters.length > 0 && (
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                  {t("filtersApplied") || "Filtros Aplicados"}
                </h3>
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-all flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  {t("clearAll") || "Limpiar todo"}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="group relative inline-flex items-center gap-2 bg-white border-2 border-purple-200 rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-all"
                  >
                    <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">
                      {filter.label}
                    </span>
                    <button
                      onClick={filter.clear}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-all"
                      title={t("remove") || "Eliminar"}
                    >
                      <FaTrashCan className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contenido de filtros */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 hover:border-purple-300 transition-colors">
                <Brands onChange={setBrand} brand={brand} />
              </div>
              
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 hover:border-purple-300 transition-colors">
                <Items onChange={setItem} item={item} />
              </div>
              
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 hover:border-purple-300 transition-colors">
                <VehiclesBrands />
              </div>
            </div>
          </div>

          {/* Footer con contador */}
          {activeFilters.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-red-500 via-white to-blue-500 border-t-2 border-white">
              <div className="flex items-center justify-between text-white">
                <span className="text-sm font-semibold">
                  {t("activeFiltersCount") || "Filtros activos"}
                </span>
                <span className="px-3 py-1 bg-white text-purple-600 rounded-full font-bold text-sm">
                  {activeFilters.length}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ec4899, #a855f7, #3b82f6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #db2777, #9333ea, #2563eb);
        }
      `}</style>
    </>
  );
};

export default FilterBox;