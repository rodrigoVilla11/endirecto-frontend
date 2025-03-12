"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchArticlesQuery } from "@/redux/services/articlesApi";
import CardSearch from "./CardSearch";
import { useFilters } from "@/app/context/FiltersContext";
import { useArticleId } from "@/app/context/AritlceIdContext";
import Modal from "../../components/Modal";
import ArticleDetails from "./Articles/components/ArticleDetails";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useTranslation } from "react-i18next";

interface ArticleSearchResultsProps {
  query: string;
  setSearchQuery: (value: string) => void;
  router: any;
}

const ArticleSearchResults = ({
  query,
  setSearchQuery,
  router,
}: ArticleSearchResultsProps) => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  // Endpoint para buscar artículos por query
  const {
    data: searchResults,
    error,
    isLoading,
  } = useSearchArticlesQuery({ query, page: 1, limit: 6 });

  const { setSearch } = useFilters();
  const { setArticleId } = useArticleId();
  const [isModalOpen, setModalOpen] = useState(false);
  // Estado para mostrar mensaje temporal si no hay cliente seleccionado
  const [showAlert, setShowAlert] = useState(false);

  // Referencia al contenedor del componente
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRedirect = useCallback(
    (path: string) => {
      if (path) {
        setSearch(query);
        router.push(path);
        setSearchQuery("");
      }
    },
    [query, router, setSearch, setSearchQuery]
  );

  // Listener global para la tecla Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && searchResults && searchResults.length > 0) {
        handleRedirect(`/catalogue`);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleRedirect, searchResults]);

  // Listener para detectar clics fuera del contenedor y limpiar el query
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSearchQuery("");
        setArticleId("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [setSearchQuery]);

  const handleOpenModal = (id: string) => {
    if (!selectedClientId) {
      // Si no hay cliente seleccionado, mostrar mensaje temporal
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    setModalOpen(true);
    setArticleId(id);
  };

  const closeModal = () => setModalOpen(false);

  if (!query) {
    return null; // Si no hay texto en la búsqueda, no mostramos nada
  }

  return (
    <div
      ref={containerRef}
      className="fixed top-28 md:top-16 left-0 right-0 bg-[rgba(0,0,0,0.8)] shadow-lg p-6 z-50 h-auto max-h-[80vh] flex flex-col justify-between items-center rounded-b-lg border-2 border-black"
    >
      <div className="flex justify-between items-center w-full mb-4">
        <h3 className="text-lg font-bold text-white">
          {t("resultsFor", { query })}
        </h3>
      </div>

      {/* Mensaje temporal si no hay cliente seleccionado */}
      {showAlert && (
        <div className="bg-red-200 text-red-600 p-2 rounded mb-4">
          {t("pleaseSelectClient", "Por favor, seleccione un cliente.")}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center w-full h-40">
          {/* Spinner de carga */}
          <svg
            className="animate-spin h-10 w-10 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {error && (
        <p className="text-red-500">{t("errorLoadingArticles")}</p>
      )}

      {searchResults && searchResults.length === 0 && (
        <p className="text-gray-300">{t("noResultsFound")}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full px-2 overflow-auto">
        {searchResults &&
          searchResults.length > 0 &&
          searchResults.map((article, index) => (
            <div key={index} className="w-full">
              <CardSearch
                article={article}
                setSearchQuery={setSearchQuery}
                handleOpenModal={handleOpenModal}
              />
            </div>
          ))}
      </div>

      {searchResults && searchResults.length > 0 && (
        <button
          onClick={() => handleRedirect(`/catalogue`)}
          className="mt-6 bg-white text-black px-8 py-3 rounded-lg hover:bg-blue-700 hover:text-white transition duration-300 transform hover:scale-105 focus:outline-none shadow-lg"
        >
          {t("seeMore")}
        </button>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ArticleDetails closeModal={closeModal} />
      </Modal>
    </div>
  );
};

export default ArticleSearchResults;
