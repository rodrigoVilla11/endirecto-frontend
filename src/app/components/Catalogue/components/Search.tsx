"use client";
import React, { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import Modal from "../../components/Modal";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import ArticleName from "./Articles/components/ArticleName";

const ArticleSearchResults = ({ query }: { query: string }) => {
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

  if (!query) {
    return null; // Si no hay texto en la barra de búsqueda, no mostramos nada
  }

  return (
    <div className="fixed top-16 left-20 right-0 bg-[rgba(0,0,0,0.8)] shadow-lg p-6 z-50 h-auto max-h-[80vh] flex flex-col justify-between items-center rounded-lg border-2 border-black">
      {/* Título y botón de comparar */}
      <div className="flex justify-between items-center w-full mb-4">
        <h3 className="text-lg font-bold text-white">
          Resultados para "{query}":
        </h3>
      </div>

      {/* Estado de carga o error */}
      {isLoading && <p className="text-gray-500">Cargando...</p>}
      {error && (
        <p className="text-red-500">
          Ocurrió un error al cargar los artículos.
        </p>
      )}

      {/* Resultados */}
      <div className="flex flex-wrap justify-center gap-6 overflow-auto">
        {articles &&
          articles.map((article: any) => (
            <div key={article.id} className="relative w-44 max-w-xs">
              {/* Contenido del artículo */}
              <div className="relative flex flex-col justify-center items-center shadow-lg bg-white cursor-pointer rounded-lg hover:shadow-xl transition-all duration-300">
                <img
                  src={article.images ? article.images[0] : ""}
                  alt={article.name}
                  className="w-32 h-40 object-contain rounded-lg"
                />
                <div className="bg-gray-100 px-4 py-2 w-full text-center rounded-lg">
                  <ArticleName
                    name={article.name}
                    id={article.id}
                    noName={true}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>

      <button className="mt-6 bg-white text-black px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 focus:outline-none shadow-lg">
        Ver más...
      </button>
    </div>
  );
};

export default ArticleSearchResults;
