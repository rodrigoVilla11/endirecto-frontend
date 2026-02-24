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
import { useCreateSearchMutation } from "@/redux/services/searchesApi";

interface ArticleSearchResultsProps {
  query: string;
  setSearchQuery: (value: string) => void;
  router: any;
  inputRef: React.RefObject<HTMLInputElement>;
}

const ArticleSearchResults = ({
  query,
  setSearchQuery,
  router,
  inputRef,
}: ArticleSearchResultsProps) => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const { showPurchasePrice } = useFilters();

  const {
    data: searchResults,
    error,
    isLoading,
  } = useSearchArticlesQuery(
    { query, page: 1, limit: 6 },
    { skip: !query }
  );
  const { setSearch } = useFilters();
  const { setArticleId } = useArticleId();
  const [isModalOpen, setModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // Hook para enviar un nuevo search si no hay resultados
  const [createSearch] = useCreateSearchMutation();
  // Flag para evitar enviar varias veces para la misma query
  const [searchSent, setSearchSent] = useState(false);

  // Reiniciamos el flag cuando la query cambia
  useEffect(() => {
    setSearchSent(false);
  }, [query]);

  // Ref para el contenedor de la búsqueda
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref para el contenido del modal
  const modalContentRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const clickedInsideContainer = containerRef.current?.contains(target);
      const clickedInsideModal = modalContentRef.current?.contains(target);
      const clickedIgnored = target.closest("[data-ignore-click]");

      if (!clickedInsideContainer && !clickedInsideModal && !clickedIgnored) {
        setSearchQuery("");
        setArticleId("");
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setSearchQuery, setArticleId]); // 🔒 sin inputRef

  const handleOpenModal = (id: string) => {
    if (!selectedClientId) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    setModalOpen(true);
    setArticleId(id);
  };

  const closeModal = () => setModalOpen(false);

  // Efecto para enviar un nuevo search si no hay resultados y no se ha enviado ya
  useEffect(() => {
    if (
      query &&
      !isLoading &&
      searchResults &&
      searchResults.length === 0 &&
      !searchSent
    ) {
      createSearch({ search: query, quantity: 1 })
        .unwrap()
        .then((res) => {})
        .catch((err) => {
          console.error("Error creating search:", err);
        });
      setSearchSent(true);
    }
  }, [query, searchResults, isLoading, searchSent, createSearch]);

  // Si no hay query, renderizamos un contenedor vacío para mantener el orden de los Hooks
  if (!query) {
    return <div />;
  }

  return (
    <div
      ref={containerRef}
      className="
      fixed top-28 md:top-16 left-0 right-0 z-50
      bg-[#0B0B0B]/90 backdrop-blur-xl
      border-b border-white/10
      shadow-2xl
      p-6
      max-h-[80vh]
      flex flex-col
      rounded-b-2xl
    "
    >
      <div className="flex justify-between items-center w-full mb-4">
        <h3 className="text-lg font-extrabold text-white">
          {t("resultsFor", { query })}
          <span className="text-[#E10600]">.</span>
        </h3>
      </div>

      {showAlert && (
        <div className="bg-[#E10600]/10 border border-[#E10600]/30 text-white px-3 py-2 rounded-xl mb-4">
          {t("pleaseSelectClient", "Por favor, seleccione un cliente.")}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center w-full h-40">
          <svg
            className="animate-spin h-10 w-10 text-white/80"
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {error && (
        <p className="text-[#E10600] font-semibold">
          {t("errorLoadingArticles")}
        </p>
      )}

      {searchResults && searchResults.length === 0 && (
        <p className="text-white/60 font-semibold">{t("noResultsFound")}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full px-2 overflow-auto">
        {searchResults?.map((article, index) => (
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
          className="
          mt-6
          bg-[#E10600] text-white
          px-8 py-3 rounded-2xl
          hover:bg-[#c80500]
          transition duration-300
          transform hover:scale-[1.02] active:scale-[0.98]
          focus:outline-none focus:ring-2 focus:ring-[#E10600]/25
          shadow-lg
          self-center
          font-extrabold
        "
        >
          {t("seeMore")}
        </button>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div ref={modalContentRef}>
          <ArticleDetails
            closeModal={closeModal}
            showPurchasePrice={showPurchasePrice}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ArticleSearchResults;
