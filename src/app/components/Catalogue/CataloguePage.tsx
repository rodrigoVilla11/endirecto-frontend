"use client";
import React, { useEffect, useState } from "react";
import FilterBox from "./components/FilterBox/FilterBox";
import Articles from "./components/Articles/Articles";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import Modal from "../components/Modal";
import PopUpModal from "./components/PopUpModal";
import { useClient } from "@/app/context/ClientContext";
import { useRouter } from "next/navigation";
import { useFilters } from "@/app/context/FiltersContext";
import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useTranslation } from "react-i18next";
import { FaFilter } from "react-icons/fa";
import SidebarFilters from "./components/FilterBox/SideBarFilters";

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
    search,
  } = useFilters();
  const { selectedClientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page: 1,
    limit: 20,
    priceListId: customer?.price_list_id,
    brand,
    item,
    tags: tags[0],
    stock,
    vehicle_brand: vehicleBrand,
    query: search,
    sort: order,
  });

  const filterBy = "popups";
  const { data: marketing } = useGetMarketingByFilterQuery({ filterBy });

  const router = useRouter();
  const { isMobile } = useMobile();

  const [isModalVisible, setModalVisible] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    if (!selectedClientId) {
      router.push("/selectCustomer");
    } else {
      const visualizationLimit = marketing?.[0]?.popups?.visualization || 0;
      const currentVisualizationCount = parseInt(
        sessionStorage.getItem("popupVisualizationCount") || "0",
        10
      );

      if (currentVisualizationCount < visualizationLimit) {
        setModalVisible(true);
        sessionStorage.setItem(
          "popupVisualizationCount",
          (currentVisualizationCount + 1).toString()
        );
      }
    }
  }, [selectedClientId, router, marketing]);

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  if (error) return <p>{t("loading")}</p>;

  const closeModal = () => {
    setModalVisible(false);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="min-h-screen p-4 mt-4 bg-[#0B0B0B]">
      {/* Botón flotante para abrir sidebar en mobile */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#1F1F1F] rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
        >
          <FaFilter className="text-xl" />
        </button>
      )}

      <div className="flex gap-4">
        {/* Sidebar vertical - desktop siempre visible, mobile modal */}
        {!isMobile ? (
          <SidebarFilters />
        ) : (
          isSidebarVisible && (
            <div className="fixed inset-0 z-40 bg-black/50 flex items-end">
              <div className="w-full bg-white/10 backdrop-blur-lg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
                <div className="sticky top-0 bg-[#E10600]  p-4 flex justify-between items-center rounded-t-3xl z-10">
                  <h2 className="text-lg font-bold text-white uppercase">
                    Filtros
                  </h2>
                  <button
                    onClick={toggleSidebar}
                    className="text-white text-2xl hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
                <div className="p-4">
                  <SidebarFilters />
                </div>
              </div>
            </div>
          )
        )}

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Barra de filtros horizontal - visible en desktop y mobile */}
          <FilterBox
            isVisible={true}
            onClose={() => {}}
            totalResults={data?.totalItems || 0}
          />

          {/* Artículos */}
          <div className="w-full">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <Articles
                brand={brand}
                item={item}
                vehicleBrand={vehicleBrand}
                stock={stock}
                tags={tags}
                order={order}
                cart={cart}
                showPurchasePrice={showPurchasePrice}
                showArticles="catalogue"
                query={search}
              />
            )}

            <Modal isOpen={isModalVisible} onClose={closeModal}>
              <PopUpModal
                closeModal={closeModal}
                handleRedirect={handleRedirect}
              />
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CataloguePage;
