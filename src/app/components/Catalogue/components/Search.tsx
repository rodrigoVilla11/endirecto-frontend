"use client";
import React, { useState } from "react";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import CardSearch from "./CardSearch";
import { useFilters } from "@/app/context/FiltersContext";
import { useArticleId } from "@/app/context/AritlceIdContext";
import Modal from "../../components/Modal";
import ArticleDetails from "./Articles/components/ArticleDetails";

const ArticleSearchResults = ({
  query,
  setSearchQuery,
  router,
}: {
  query: string;
  setSearchQuery: any;
  router: any;
}) => {
  const limit = 6;
  const {
    data: articles,
    error,
    isLoading,
    refetch,
  } = useGetArticlesQuery({
    limit,
    query,
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

      {isLoading && <p className="text-gray-300">Cargando...</p>}

      {error && (
        <p className="text-red-500">
          Ocurrió un error al cargar los artículos.
        </p>
      )}

      {articles && articles.length === 0 && (
        <p className="text-gray-300">
          No se encontraron resultados para tu búsqueda.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full px-2 overflow-auto">
        {articles &&
          articles.length > 0 &&
          articles.map((article) => (
            <div key={article.id} className="w-full">
              <CardSearch
                article={article}
                setSearchQuery={setSearchQuery}
                handleOpenModal={handleOpenModal}
              />
            </div>
          ))}
      </div>

      {articles && articles.length > 0 && (
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
