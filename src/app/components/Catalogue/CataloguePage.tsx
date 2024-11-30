"use client";
import React, { useEffect, useState } from "react";
import FilterBox from "./components/FilterBox/FilterBox";
import { FaFilter, FaList } from "react-icons/fa";
import { RxDashboard } from "react-icons/rx";
import Articles from "./components/Articles/Articles";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import Modal from "../components/Modal";
import PopUpModal from "./components/PopUpModal";
import { useClient } from "@/app/context/ClientContext";
import { useRouter } from "next/navigation";
import { useFilters } from "@/app/context/FiltersContext";
import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";
import { useArticleId } from "@/app/context/AritlceIdContext";

const CataloguePage = () => {
  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page: 1,
    limit: 16,
  });
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

  const filterBy = "popups";
  const {
    data: marketing,
    error: marketingError,
    isLoading: marketingIsLoading,
  } = useGetMarketingByFilterQuery({ filterBy });

  const { selectedClientId } = useClient();
  const router = useRouter();

  const [isFilterBoxVisible, setFilterBoxVisible] = useState(true);
  const [showArticles, setShowArticles] = useState("catalogue");
  const [isModalVisible, setModalVisible] = useState(false);

  

  useEffect(() => {
    if (!selectedClientId) {
      router.push("/selectCustomer"); 
    } else {
      const visualizationLimit = marketing?.[0]?.popups?.visualization || 0;
      const currentVisualizationCount = parseInt(sessionStorage.getItem('popupVisualizationCount') || '0', 10);

      if (currentVisualizationCount < visualizationLimit) {
        setModalVisible(true);
        sessionStorage.setItem('popupVisualizationCount', (currentVisualizationCount + 1).toString());
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

  return (
    <div className="gap-4 p-2">
      <h3 className="text-bold p-4">CATALOGUE</h3>
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
            <p className="text-xs pr-4">{data?.length || 0}</p>
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
