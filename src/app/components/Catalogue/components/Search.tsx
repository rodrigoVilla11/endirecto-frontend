"use client";
import React, { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import Modal from "../../components/Modal";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";

const ArticleSearchResults = ({ query }: { query: string }) => {
  const { data: articles, error, isLoading, refetch } = useGetArticlesQuery({
    query,
  });

  if (!query) {
    return null; // Si no hay texto en la barra de búsqueda, no mostramos nada
  }

  return (
    <div className="fixed top-16 left-20 right-0 bg-white shadow-md p-4 z-50 h-64">
      {/* Título y botón de comparar */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Resultados para "{query}":</h3>
      </div>

      {/* Estado de carga o error */}
      {isLoading && <p>Cargando...</p>}
      {error && <p className="text-red-500">Ocurrió un error al cargar los artículos.</p>}

      {/* Resultados */}
      <div className="flex space-x-4 overflow-x-auto h-44">
        {articles &&
          articles.map((article: any) => (
            <div key={article.id} className="relative h-24">
              {/* Contenido del artículo */}
              <div className="flex flex-col items-center space-y-2">
                <img
                  src={article.images ? article.images[0] : ""}
                  alt={article.name}
                  className="w-16 h-20 object-contain"
                />
                <p className="text-sm text-center">{article.name}</p>
              </div>
            </div>
          ))}
      </div>

    </div>
  );
};

export default ArticleSearchResults;