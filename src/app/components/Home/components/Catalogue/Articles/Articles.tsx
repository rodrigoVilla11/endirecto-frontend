import React, { useEffect, useRef, useState } from "react";
import CardArticle from "./components/CardArticles";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useAuth } from "@/app/context/AuthContext";
import CardArticles from "@/app/components/Catalogue/components/Articles/components/CardArticles";
import ListArticle from "@/app/components/Catalogue/components/Articles/components/ListArticle";
import ListArticles from "./components/ListArticles";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useClient } from "@/app/context/ClientContext";
import { Loader2, PackageX, AlertCircle } from "lucide-react";

const Articles = ({
  brand,
  item,
  vehicleBrand,
  stock,
  tags,
  order,
  showPurchasePrice,
  showArticles,
}: any) => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    brand,
    item,
    vehicleBrand,
    stock,
    tags,
    sort: order,
  });

  const { selectedClientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page,
    limit: 20,
    priceListId: customer?.price_list_id,
    ...filters,
  });

  const { isAuthenticated } = useAuth();
  const { isOpen } = useSideMenu();

  const [items, setItems] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFetching && data) {
      setIsFetching(true);
      
      const newArticles = data.articles || [];
  
      if (page === 1) {
        setItems(newArticles);
      } else {
        setItems((prev) => [...prev, ...newArticles]);
      }
  
      setIsFetching(false);
    }
  }, [data, page, filters, isFetching]);

  // Configurar Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetching && data?.articles?.length === 20) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [isFetching, data]);

  useEffect(() => {
    setPage(1);
    setItems([]);
    setFilters({
      brand,
      item,
      vehicleBrand,
      stock,
      tags,
      sort: order,
    });
  }, [brand, item, vehicleBrand, stock, tags, order]);

  // Loading inicial
  if (isLoading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl m-4">
        <div className="text-center p-8">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-700">
            Cargando productos...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Estamos preparando el catálogo para ti
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-gradient-to-br from-red-50 to-red-100 rounded-3xl m-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-700 mb-2">
            Error al cargar productos
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            No pudimos cargar los productos. Por favor, intenta nuevamente.
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-rose-600 transition-all shadow-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl m-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <PackageX className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-700 mb-2">
            No hay productos
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            No se encontraron productos con los filtros aplicados.
          </p>
          <button
            onClick={() => {
              setPage(1);
              setItems([]);
              setFilters({
                brand: "",
                item: "",
                vehicleBrand: "",
                stock: "",
                tags: "",
                sort: "",
              });
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Contador de resultados */}
      <div className="mb-4 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-200 inline-flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">
            Resultados encontrados:
          </span>
          <span className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full text-sm">
            {data?.totalItems || items.length}
          </span>
        </div>
      </div>

      {/* Grid/List de productos */}
      {showArticles === "catalogue" ? (
        <div
          className={`overflow-auto custom-scrollbar h-[calc(100vh-250px)] px-4 pb-4 grid ${
            isOpen 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          } gap-6`}
        >
          {items?.map((article: any, index: number) => (
            <div
              key={`${article.id}-${index}`}
              className="transform hover:scale-105 transition-transform duration-300"
            >
              {!isAuthenticated ? (
                <CardArticle
                  article={article}
                  showPurchasePrice={showPurchasePrice}
                />
              ) : (
                <CardArticles
                  article={article}
                  showPurchasePrice={showPurchasePrice}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-auto custom-scrollbar h-[calc(100vh-250px)] px-4 pb-4 space-y-4">
          {items?.map((article: any, index: number) => (
            <div
              key={`${article.id}-${index}`}
              className="transform hover:scale-[1.02] transition-all duration-300"
            >
              {isAuthenticated ? (
                <ListArticle
                  article={article}
                  showPurchasePrice={showPurchasePrice}
                />
              ) : (
                <ListArticles
                  article={article}
                  showPurchasePrice={showPurchasePrice}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Loading más items */}
      {isFetching && items.length > 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-3 bg-white rounded-2xl shadow-lg px-6 py-4 border-2 border-purple-200">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            <span className="text-sm font-semibold text-gray-700">
              Cargando más productos...
            </span>
          </div>
        </div>
      )}

      {/* Fin de resultados */}
      {!isFetching && items.length > 0 &&  data?.articles?.length && data?.articles?.length < 20 && (
        <div className="flex justify-center items-center py-8">
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl shadow-lg px-6 py-4 border-2 border-gray-300">
            <span className="text-sm font-semibold text-gray-600">
              ✓ Has visto todos los productos
            </span>
          </div>
        </div>
      )}

      {/* Observer para scroll infinito */}
      <div ref={observerRef} className="h-4" />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ec4899, #a855f7, #3b82f6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #db2777, #9333ea, #2563eb);
        }
      `}</style>
    </div>
  );
};

export default Articles;