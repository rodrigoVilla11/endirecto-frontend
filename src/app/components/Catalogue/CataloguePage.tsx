"use client";
import React, { useEffect, useState } from "react";
import FilterBox from "./components/FilterBox/FilterBox";
import { FaFilter, FaList } from "react-icons/fa";
import { RxDashboard } from "react-icons/rx";
import Articles from "./components/Articles/Articles";
import {
  useGetArticlesQuery,
} from "@/redux/services/articlesApi";
import Modal from "../components/Modal";
import PopUpModal from "./components/PopUpModal";
import { useClient } from "@/app/context/ClientContext";
import { useRouter } from "next/navigation";
import { useFilters } from "@/app/context/FiltersContext";
import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
const CataloguePage = () => {
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
    brand: brand,
    item: item,
    tags: tags[0],
    stock: stock,
    vehicle_brand: vehicleBrand,
    query: search,
    sort: order,
  });

  const filterBy = "popups";
  const {
    data: marketing,
    error: marketingError,
    isLoading: marketingIsLoading,
  } = useGetMarketingByFilterQuery({ filterBy });

  const router = useRouter();
  const { isMobile } = useMobile();

  const [isFilterBoxVisible, setFilterBoxVisible] = useState(
    isMobile ? false : true
  );
  const [showArticles, setShowArticles] = useState("catalogue");
  const [isModalVisible, setModalVisible] = useState(false);

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

  if (error) return <p>Loading...</p>;

  const toggleFilterBox = () => {
    setFilterBoxVisible((prevState) => !prevState);
  };

  const toggleShowArticles = (type: any) => {
    setShowArticles(type);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const isFiltered =
    brand || tags?.length || stock || item || vehicleBrand || search;

  return (
    <div className="gap-4 p-2">
      {/* 🔹 Sección del título y conteo de artículos */}
      <div className="flex justify-between items-center p-4">
        <h3 className="text-bold">CATALOGUE</h3>
        <p className="absolute text-xs text-gray-600 font-semibold pt-24 right-10">
          {data?.totalItems || 0} Articles
        </p>
      </div>

      <div className="flex gap-2 ">
        <FilterBox
          isVisible={isFilterBoxVisible}
          onClose={() => setFilterBoxVisible(false)}
        />
        <div className="w-full flex flex-col">
          <div className="flex justify-between items-end w-full">
            <div className="flex justify-center gap-2 px-2">
              <button
                onClick={toggleFilterBox}
                className={`p-2 flex items-center justify-center text-sm gap-2 h-8 ${
                  isFilterBoxVisible
                    ? "bg-primary text-white"
                    : "bg-white text-primary border border-primary"
                } rounded`}
              >
                <FaFilter
                  className={`${
                    isFilterBoxVisible ? "text-white" : "text-primary"
                  }`}
                />
                Filters
              </button>
              <button
                onClick={() => toggleShowArticles("catalogue")}
                className={`p-2 flex items-center justify-center text-sm gap-2 h-8 ${
                  showArticles === "catalogue"
                    ? "bg-primary text-white"
                    : "bg-white text-primary border border-primary"
                } text-white rounded`}
              >
                <RxDashboard
                  className={`${
                    showArticles === "catalogue" ? "text-white" : "text-primary"
                  }`}
                />
              </button>
              <button
                onClick={() => toggleShowArticles("list")}
                className={`p-2 flex items-center justify-center text-sm gap-2 h-8 ${
                  showArticles === "list"
                    ? "bg-primary text-white"
                    : "bg-white text-primary border border-primary"
                } text-white rounded`}
              >
                <FaList
                  className={`${
                    showArticles === "list" ? "text-white" : "text-primary"
                  }`}
                />
              </button>
            </div>
          </div>

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
            query={search}
          />

          <Modal isOpen={isModalVisible} onClose={closeModal}>
            <PopUpModal
              closeModal={closeModal}
              handleRedirect={handleRedirect}
            />
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default CataloguePage;
