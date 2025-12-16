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
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-[#0B0B0B] rounded-3xl m-4 border border-white/10">
      <div className="text-center p-8">
        <Loader2 className="w-16 h-16 text-[#E10600] animate-spin mx-auto mb-4" />
        <p className="text-xl font-extrabold text-white">Cargando productos...</p>
        <p className="text-sm text-white/60 mt-2">Estamos preparando el catálogo para ti</p>
      </div>
    </div>
  );
}

// Error state
if (error) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-[#0B0B0B] rounded-3xl m-4 border border-white/10">
      <div className="text-center p-8 bg-white/5 border border-white/10 rounded-3xl shadow-xl max-w-md backdrop-blur">
        <AlertCircle className="w-16 h-16 text-[#E10600] mx-auto mb-4" />
        <h3 className="text-xl font-extrabold text-white mb-2">
          Error al cargar productos
        </h3>
        <p className="text-sm text-white/60 mb-4">
          No pudimos cargar los productos. Por favor, intenta nuevamente.
        </p>
        <button
          onClick={() => refetch()}
          className="px-6 py-3 bg-[#E10600] text-white font-extrabold rounded-2xl hover:bg-[#c80500] transition-all shadow-lg"
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
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-[#0B0B0B] rounded-3xl m-4 border border-white/10">
      <div className="text-center p-8 bg-white/5 border border-white/10 rounded-3xl shadow-xl max-w-md backdrop-blur">
        <PackageX className="w-20 h-20 text-white/40 mx-auto mb-4" />
        <h3 className="text-2xl font-extrabold text-white mb-2">No hay productos</h3>
        <p className="text-sm text-white/60 mb-4">
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
          className="px-6 py-3 bg-[#E10600] text-white font-extrabold rounded-2xl hover:bg-[#c80500] transition-all shadow-lg"
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
      <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl shadow-lg p-4 inline-flex items-center gap-3">
        <span className="text-sm font-semibold text-white/70">
          Resultados encontrados:
        </span>
        <span className="px-4 py-1 bg-[#E10600] text-white font-extrabold rounded-full text-sm">
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
            className="transform hover:scale-[1.02] transition-transform duration-300"
          >
            {!isAuthenticated ? (
              <CardArticle article={article} showPurchasePrice={showPurchasePrice} />
            ) : (
              <CardArticles article={article} showPurchasePrice={showPurchasePrice} />
            )}
          </div>
        ))}
      </div>
    ) : (
      <div className="overflow-auto custom-scrollbar h-[calc(100vh-250px)] px-4 pb-4 space-y-4">
        {items?.map((article: any, index: number) => (
          <div
            key={`${article.id}-${index}`}
            className="transform hover:scale-[1.01] transition-all duration-300"
          >
            {isAuthenticated ? (
              <ListArticle article={article} showPurchasePrice={showPurchasePrice} />
            ) : (
              <ListArticles article={article} showPurchasePrice={showPurchasePrice} />
            )}
          </div>
        ))}
      </div>
    )}

    {/* Loading más items */}
    {isFetching && items.length > 0 && (
      <div className="flex justify-center items-center py-8">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur rounded-2xl shadow-lg px-6 py-4">
          <Loader2 className="w-6 h-6 text-[#E10600] animate-spin" />
          <span className="text-sm font-semibold text-white/70">
            Cargando más productos...
          </span>
        </div>
      </div>
    )}

    {/* Fin de resultados */}
    {!isFetching && items.length > 0 && data?.articles?.length && data?.articles?.length < 20 && (
      <div className="flex justify-center items-center py-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-lg px-6 py-4 backdrop-blur">
          <span className="text-sm font-semibold text-white/70">
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
        background: rgba(255, 255, 255, 0.06);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e10600;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #c80500;
      }
    `}</style>
  </div>
);
};

export default Articles;