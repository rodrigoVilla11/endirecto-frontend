import React, { useEffect, useRef, useState, useMemo } from "react";
import CardArticles from "./components/CardArticles";
import ListArticle from "./components/ListArticle";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";

interface ArticlesProps {
  brand?: string;
  item?: string;
  vehicleBrand?: string;
  stock?: string;
  tags?: any;
  cart?: any;
  order?: string;
  showPurchasePrice?: boolean;
  showArticles?: "catalogue" | "list";
  query?: string;
}

const Articles: React.FC<ArticlesProps> = ({
  brand,
  item,
  vehicleBrand,
  stock,
  tags,
  cart,
  order,
  showPurchasePrice = false,
  showArticles = "catalogue",
  query,
}) => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { selectedClientId } = useClient();
  const { isOpen } = useSideMenu();
  
  // Referencia para el contenedor scrollable y para el elemento observador
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const prevFiltersRef = useRef<string>("");

  const filters = useMemo(
    () => ({
      brand,
      item,
      vehicle_brand: vehicleBrand,
      stock,
      tags,
      query,
      sort: order,
    }),
    [brand, item, vehicleBrand, stock, tags, query, order]
  );

  // Convertir los filtros a string para comparar cambios
  const filtersString = JSON.stringify(filters);

  const { data: customer } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

  const { data, isLoading, isFetching } = useGetArticlesQuery({
    page,
    limit: 20,
    priceListId: customer?.price_list_id,
    ...filters,
  });

  // Reinicia los items cuando cambien los filtros
  useEffect(() => {
    if (prevFiltersRef.current !== filtersString) {
      setItems([]); // Limpiar items inmediatamente
      setPage(1);
      setIsLoadingMore(false);
      prevFiltersRef.current = filtersString;
    }
  }, [filtersString]);

  // Actualiza los items cuando llegan nuevos datos
  useEffect(() => {
    if (data?.articles) {
      if (page === 1) {
        setItems(data.articles);
      } else {
        setItems((prev) => [...prev, ...data.articles]);
      }
    }
  }, [data?.articles, page]);

  // Efecto para el infinite scroll
  useEffect(() => {
    // Si no hay contenedor o elemento observador, salimos
    if (!containerRef.current || !observerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Puedes agregar un log para ver cuándo se dispara el callback
        // console.log("Observer entry:", entry);
        if (
          entry.isIntersecting &&
          !isLoading &&
          !isFetching &&
          !isLoadingMore &&
          Array.isArray(data?.articles) &&
          data.articles.length > 0
        ) {
          setIsLoadingMore(true);
          setPage((prev) => prev + 1);
        }
      },
      {
        // Establece el contenedor scrollable como root
        root: containerRef.current,
        threshold: 0.5,
      }
    );

    const currentObserverElem = observerRef.current;
    observer.observe(currentObserverElem);

    return () => {
      observer.unobserve(currentObserverElem);
    };
  }, [isLoading, isFetching, isLoadingMore, data?.articles]);

  // Resetea isLoadingMore cuando termina la carga
  useEffect(() => {
    if (!isFetching && isLoadingMore) {
      setIsLoadingMore(false);
    }
  }, [isFetching, isLoadingMore]);

  const showLoading = isLoading || (isFetching && page === 1);

  return (
    <div className="m-4 flex flex-col text-sm relative">
      {showLoading && (
        <div className="absolute inset-0 flex items-start justify-center bg-opacity-80 z-50 p-20">
          <img src="/dma.png" alt="Loading..." className="h-40 w-60" />
          <div className="absolute top-64 w-1/2 h-1 bg-gray-300 overflow-hidden">
            <div className="h-full bg-blue-500 loading-bar" />
          </div>
        </div>
      )}

      {!showLoading && items.length === 0 && (
        <div className="flex justify-center items-center h-full">
          No se encontraron artículos
        </div>
      )}

      {items.length > 0 && (
        <div
          // Este contenedor es el que tiene scroll
          ref={containerRef}
          className={`overflow-auto no-scrollbar h-[900px] ${
            showArticles === "catalogue"
              ? isOpen
                ? "grid gap-6 justify-items-center grid-cols-[repeat(auto-fit,_minmax(180px,_1fr))]"
                : "grid gap-6 justify-items-center grid-cols-[repeat(auto-fit,_minmax(185px,_1fr))]"
              : ""
          }`}
        >
          {showArticles === "catalogue" ? (
            items.map((article, index) => (
              <CardArticles
                key={article.id || index}
                article={article}
                showPurchasePrice={showPurchasePrice}
              />
            ))
          ) : (
            <>
              {items.map((article, index) => (
                <ListArticle
                  key={article.id || index}
                  article={article}
                  showPurchasePrice={showPurchasePrice}
                />
              ))}
            </>
          )}

          {/* Elemento observador colocado al final del contenedor scrollable */}
          <div ref={observerRef} className="h-20 flex items-center justify-center">
            {isFetching && !showLoading && (
              <div className="text-center py-4 text-xs font-semibold text-center">Cargando más artículos...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Articles;
