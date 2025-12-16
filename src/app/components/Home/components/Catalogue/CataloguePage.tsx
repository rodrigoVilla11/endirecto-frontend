"use client";
import React, { useState } from "react";
import { FaFilter, FaList } from "react-icons/fa";
import { RxDashboard } from "react-icons/rx";
import { useRouter } from "next/navigation";
import { useFilters } from "@/app/context/FiltersContext";
import Modal from "@/app/components/components/Modal";
import PopUpModal from "./Articles/PopUpModal";
import FilterBox from "./FilterBox/FilterBox";
import { useTranslation } from "react-i18next";
import { Grid3x3, List, SlidersHorizontal } from "lucide-react";
import Articles from "./Articles/Articles";

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
    <div className="min-h-screen bg-[#0B0B0B] mt-6">
      {/* Header */}
      <div className="bg-[#0B0B0B] border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            🛍️ {t("catalogueHeader") || "Catálogo"}
            <span className="text-[#E10600]">.</span>
          </h1>
          <div className="mt-3 h-1 w-24 rounded-full bg-[#E10600]" />
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
            <div className="rounded-3xl p-4 bg-white/5 border border-white/10 backdrop-blur shadow-xl">
              <div className="flex flex-wrap items-center gap-3">
                {/* Botón de filtros */}
                <button
                  onClick={toggleFilterBox}
                  className={`
                  group flex items-center gap-2
                  px-6 py-3 rounded-2xl
                  font-bold text-sm
                  transition-all duration-200
                  border shadow-lg
                  ${
                    isFilterBoxVisible
                      ? "bg-[#E10600] text-white border-[#E10600]"
                      : "bg-white/5 text-white/80 border-white/10 hover:border-[#E10600]/40 hover:bg-white/10"
                  }
                `}
                >
                  <SlidersHorizontal
                    className={`w-4 h-4 ${
                      isFilterBoxVisible
                        ? "text-white"
                        : "text-white/70 group-hover:text-[#E10600]"
                    }`}
                  />
                  <span>{t("filtersButton") || "Filtros"}</span>

                  {!isFilterBoxVisible && (
                    <span className="ml-1 px-2 py-0.5 bg-[#E10600] text-white text-xs rounded-full animate-pulse">
                      !
                    </span>
                  )}
                </button>

                {/* Separador */}
                <div className="hidden sm:block h-8 w-px bg-white/10" />

                {/* Vista catálogo */}
                <button
                  onClick={() => toggleShowArticles("catalogue")}
                  className={`
                  group flex items-center justify-center gap-2
                  px-4 py-3 rounded-2xl
                  font-bold text-sm
                  transition-all duration-200
                  border shadow-lg
                  ${
                    showArticles === "catalogue"
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/80 border-white/10 hover:border-[#E10600]/40 hover:bg-white/10"
                  }
                `}
                  title={t("catalogueView") || "Vista Catálogo"}
                >
                  <Grid3x3
                    className={`w-5 h-5 ${
                      showArticles === "catalogue"
                        ? "text-black"
                        : "text-white/70 group-hover:text-[#E10600]"
                    }`}
                  />
                  <span className="hidden md:inline">
                    {t("catalogueView") || "Catálogo"}
                  </span>
                </button>

                {/* Vista lista */}
                <button
                  onClick={() => toggleShowArticles("list")}
                  className={`
                  group flex items-center justify-center gap-2
                  px-4 py-3 rounded-2xl
                  font-bold text-sm
                  transition-all duration-200
                  border shadow-lg
                  ${
                    showArticles === "list"
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/80 border-white/10 hover:border-[#E10600]/40 hover:bg-white/10"
                  }
                `}
                  title={t("listView") || "Vista Lista"}
                >
                  <List
                    className={`w-5 h-5 ${
                      showArticles === "list"
                        ? "text-black"
                        : "text-white/70 group-hover:text-[#E10600]"
                    }`}
                  />
                  <span className="hidden md:inline">
                    {t("listView") || "Lista"}
                  </span>
                </button>

                {/* Info adicional */}
                <div className="ml-auto hidden lg:flex items-center gap-2 text-sm text-white/70">
                  <span className="font-semibold">
                    {t("activeFilters") || "Filtros activos"}:
                  </span>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full font-extrabold text-white">
                    {
                      [brand, item, vehicleBrand, stock, tags].filter(Boolean)
                        .length
                    }
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
        <PopUpModal closeModal={closeModal} handleRedirect={handleRedirect} />
      </Modal>
    </div>
  );
};

export default CataloguePage;
