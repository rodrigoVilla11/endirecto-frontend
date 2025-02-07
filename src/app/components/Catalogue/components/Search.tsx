"use client";
import React, { useState } from "react";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import CardSearch from "./CardSearch";
import { useFilters } from "@/app/context/FiltersContext";
import { useArticleId } from "@/app/context/AritlceIdContext";
import Modal from "../../components/Modal";
import ArticleDetails from "./Articles/components/ArticleDetails";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";

const ArticleSearchResults = ({
  query,
  setSearchQuery,
  router,
}: {
  query: string;
  setSearchQuery: any;
  router: any;
}) => {
  const { selectedClientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const limit = 6;
  const {
    data: articles,
    error,
    isLoading,
    refetch,
  } = useGetArticlesQuery({
    limit,
    query,
    priceListId: selectedClientId ? customer?.price_list_id : "3",
  });
  const { setSearch } = useFilters();
  const { articleId, setArticleId } = useArticleId();
  const [isModalOpen, setModalOpen] = useState(false);

  if (!query) {
    return null; // Si no hay texto en la barra de búsqueda, no mostramos nada
  }

  const handleRedirect = (path: string) => {
    if (path) {
      setSearch(query);
      router.push(path);
      setSearchQuery("");
    }
  };

  const handleOpenModal = (id: string) => {
    setModalOpen(true);
    setArticleId(id);
  };

  const closeModal = () => setModalOpen(false);

  return (
    <div className="fixed top-28 md:top-20 left-0 right-0 bg-[rgba(0,0,0,0.8)] shadow-lg p-6 z-50 h-auto max-h-[80vh] flex flex-col justify-between items-center rounded-lg border-2 border-black">
      <div className="flex justify-between items-center w-full mb-4">
        <h3 className="text-lg font-bold text-white">
          Resultados para {query}:
        </h3>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center w-full h-40">
          {/* Spinner con animación de giro */}
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
        <p className="text-red-500">
          Ocurrió un error al cargar los artículos.
        </p>
      )}

      {articles && articles.totalItems === 0 && (
        <p className="text-gray-300">
          No se encontraron resultados para tu búsqueda.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full px-2 overflow-auto">
        {articles &&
          articles.totalItems > 0 &&
          articles.articles.map((article) => (
            <div key={article.id} className="w-full">
              <CardSearch
                article={article}
                setSearchQuery={setSearchQuery}
                handleOpenModal={handleOpenModal}
              />
            </div>
          ))}
      </div>

      {articles && articles.totalItems > 0 && (
        <button
          onClick={() => handleRedirect(`/catalogue`)}
          className="mt-6 bg-white text-black px-8 py-3 rounded-lg hover:bg-blue-700 hover:text-white transition duration-300 transform hover:scale-105 focus:outline-none shadow-lg"
        >
          Ver más...
        </button>
      )}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ArticleDetails closeModal={closeModal} />
      </Modal>
    </div>
  );
};

export default ArticleSearchResults;
