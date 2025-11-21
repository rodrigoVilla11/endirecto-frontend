"use client";
import React, { useState } from "react";
import { FaFilter, FaList } from "react-icons/fa";
import { RxDashboard } from "react-icons/rx";
import { useRouter } from "next/navigation";
import { useFilters } from "@/app/context/FiltersContext";
import Articles from "./Articles/Articles";
import Modal from "@/app/components/components/Modal";
import PopUpModal from "./Articles/PopUpModal";
import FilterBox from "./FilterBox/FilterBox";
import { useTranslation } from "react-i18next";
import { Grid3x3, List, SlidersHorizontal } from "lucide-react";

const CataloguePage = () => {
  const { t } = useTranslation();
  const {
    order,
    cart,
    showPurchasePrice,
    tags,
    stock,
    brand,
    item,
    vehicleBrand,
  } = useFilters();
  const router = useRouter();

  const [isFilterBoxVisible, setFilterBoxVisible] = useState(true);
  const [showArticles, setShowArticles] = useState("catalogue");
  const [isModalVisible, setModalVisible] = useState(false);

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  const toggleFilterBox = () => {
    setFilterBoxVisible((prevState) => !prevState);
  };

  const toggleShowArticles = (type: string) => {
    setShowArticles(type);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white mt-10">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            🛍️ {t("catalogueHeader") || "Catálogo"}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filtro lateral */}
          <FilterBox
            isVisible={isFilterBoxVisible}
            onClose={() => setFilterBoxVisible(false)}
          />

          <div className="flex-1 flex flex-col gap-6">
            {/* Barra de control */}
            <div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-200">
              <div className="flex flex-wrap items-center gap-3">
                {/* Botón de filtros */}
                <button
                  onClick={toggleFilterBox}
                  className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-xl ${
                    isFilterBoxVisible
                      ? "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-500"
                  }`}
                >
                  <SlidersHorizontal className={`w-4 h-4 ${
                    isFilterBoxVisible ? "text-white" : "text-gray-700 group-hover:text-purple-500"
                  }`} />
                  <span>{t("filtersButton") || "Filtros"}</span>
                  {!isFilterBoxVisible && (
                    <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                      !
                    </span>
                  )}
                </button>

                {/* Separador */}
                <div className="hidden sm:block h-8 w-px bg-gray-300"></div>

                {/* Vista como catálogo */}
                <button
                  onClick={() => toggleShowArticles("catalogue")}
                  className={`group flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg ${
                    showArticles === "catalogue"
                      ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-emerald-500"
                  }`}
                  title={t("catalogueView") || "Vista Catálogo"}
                >
                  <Grid3x3 className={`w-5 h-5 ${
                    showArticles === "catalogue" ? "text-white" : "text-gray-700 group-hover:text-emerald-500"
                  }`} />
                  <span className="hidden md:inline">
                    {t("catalogueView") || "Catálogo"}
                  </span>
                </button>

                {/* Vista como lista */}
                <button
                  onClick={() => toggleShowArticles("list")}
                  className={`group flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg ${
                    showArticles === "list"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500"
                  }`}
                  title={t("listView") || "Vista Lista"}
                >
                  <List className={`w-5 h-5 ${
                    showArticles === "list" ? "text-white" : "text-gray-700 group-hover:text-blue-500"
                  }`} />
                  <span className="hidden md:inline">
                    {t("listView") || "Lista"}
                  </span>
                </button>

                {/* Info adicional (opcional) */}
                <div className="ml-auto hidden lg:flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-semibold">
                    {t("activeFilters") || "Filtros activos"}:
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-bold">
                    {[brand, item, vehicleBrand, stock, tags].filter(Boolean).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Contenido de artículos */}
            <Articles
              brand={brand}
              item={item}
              vehicleBrand={vehicleBrand}
              stock={stock}
              tags={tags}
              order={order}
              cart={cart}
              showPurchasePrice={showPurchasePrice}
              showArticles={showArticles}
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalVisible} onClose={closeModal}>
        <PopUpModal
          closeModal={closeModal}
          handleRedirect={handleRedirect}
        />
      </Modal>
    </div>
  );
};

export default CataloguePage;