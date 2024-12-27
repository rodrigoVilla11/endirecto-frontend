"use client";
import React from "react";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import CardSearch from "./CardSearch";
import { useRouter } from "next/navigation";
import { useFilters } from "@/app/context/FiltersContext";

const ArticleSearchResults = ({ query, setSearchQuery }: { query: string, setSearchQuery:any }) => {
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
  const {
      setSearch
    } = useFilters();

  if (!query) {
    return null; // Si no hay texto en la barra de búsqueda, no mostramos nada
  }
  const router = useRouter();


  const handleRedirect = (path: string) => {
    if (path) {
      setSearch(query)
      router.push(path);
      setSearchQuery("")
    }
  };

  return (
    <div className="fixed top-16 left-20 right-0 bg-[rgba(0,0,0,0.8)] shadow-lg p-6 z-50 h-auto max-h-[80vh] flex flex-col justify-between items-center rounded-lg border-2 border-black">
      {/* Título y botón de comparar */}
      <div className="flex justify-between items-center w-full mb-4">
        <h3 className="text-lg font-bold text-white">
          Resultados para {query}:
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
          articles.map((article: any) => <CardSearch article={article} setSearchQuery={setSearchQuery} />)}
      </div>

      <button onClick={() => handleRedirect(`/catalogue`)} className="mt-6 bg-white text-black px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 focus:outline-none shadow-lg">
        Ver más...
      </button>
    </div>
  );
};

export default ArticleSearchResults;
