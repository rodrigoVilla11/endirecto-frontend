"use client";
import React, { useState } from "react";
import { FaFilter, FaList } from "react-icons/fa";
import { RxDashboard } from "react-icons/rx";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useRouter } from "next/navigation";
import { useFilters } from "@/app/context/FiltersContext";
import Articles from "./Articles/Articles";
import Modal from "@/app/components/components/Modal";
import PopUpModal from "./Articles/PopUpModal";
import FilterBox from "./FilterBox/FilterBox";

const CataloguePage = () => {
  const { data, error, isLoading } = useGetArticlesQuery({
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
  const router = useRouter();

  // Estado para mostrar filtros, artículos como catálogo o lista, y el modal
  const [isFilterBoxVisible, setFilterBoxVisible] = useState(true);
  const [showArticles, setShowArticles] = useState("catalogue");
  const [isModalVisible, setModalVisible] = useState(false);

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading data...</p>;

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
    <div className="gap-4 p-2">
      <h3 className="text-bold p-4">CATALOGUE</h3>
      <div className="flex gap-2">
        {/* Filtro lateral */}
        <FilterBox
          isVisible={isFilterBoxVisible}
          onClose={() => setFilterBoxVisible(false)}
        />
        <div className="w-full flex flex-col">
          {/* Botones de control */}
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
                } rounded`}
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
                } rounded`}
              >
                <FaList
                  className={`${
                    showArticles === "list" ? "text-white" : "text-primary"
                  }`}
                />
              </button>
            </div>
            {/* Contador de artículos */}
            <p className="text-xs pr-4">{data?.length || 0}</p>
          </div>
          {/* Contenido dinámico */}
          <Articles
            brand={brand}
            item={item}
            vehicleBrand={vehicleBrand}
            stock={stock}
            tags={tags}
            order={order}
            cart={cart}
            showPurchasePrice={showPurchasePrice}
            showArticles={showArticles} // Pasamos el estado aquí
          />
          {/* Modal */}
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
