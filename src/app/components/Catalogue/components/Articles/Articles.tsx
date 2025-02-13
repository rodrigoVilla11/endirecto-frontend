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

  // Referencias para el scroll infinito
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

  // Reinicia los artículos cuando cambian los filtros
  useEffect(() => {
    if (prevFiltersRef.current !== filtersString) {
      setItems([]);
      setPage(1);
      setIsLoadingMore(false);
      prevFiltersRef.current = filtersString;
    }
  }, [filtersString]);

  // Agrega nuevos artículos cuando se obtienen datos
  useEffect(() => {
    if (data?.articles) {
      setItems((prev) =>
        page === 1 ? data.articles : [...prev, ...data.articles]
      );
    }
  }, [data?.articles, page]);

  // Implementación de Scroll Infinito
  useEffect(() => {
    if (!containerRef.current || !observerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
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

  useEffect(() => {
    if (!isFetching && isLoadingMore) {
      setIsLoadingMore(false);
    }
  }, [isFetching, isLoadingMore]);

  const showLoading = isLoading || (isFetching && page === 1);

  return (
    <div className="m-4 flex flex-col text-sm w-full max-w-[100vw] overflow-x-hidden">
      {/* Pantalla de carga */}
      {showLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-opacity-80 z-50 p-10">
          <img
            src="/dma.png"
            alt="Loading..."
            className="h-24 w-40 sm:h-32 sm:w-48"
          />
          <div className="mt-4 w-2/3 sm:w-1/2 h-2 bg-gray-300 overflow-hidden rounded-md">
            <div className="h-full bg-blue-500 loading-bar"></div>
          </div>
        </div>
      )}

      {/* Mensaje si no hay artículos */}
      {!showLoading && items.length === 0 && (
        <div className="flex justify-center items-center h-40 text-gray-600">
          No se encontraron artículos
        </div>
      )}

      {/* Contenedor de artículos con scroll */}
      {items.length > 0 && (
        <div
          ref={containerRef}
          className={`overflow-auto no-scrollbar max-h-screen p-2 w-full flex justify-center ${
            showArticles === "catalogue"
              ? "grid gap-4 grid-cols-[repeat(auto-fit,_minmax(190px,_1fr))] place-items-center"
              : "flex flex-col justify-center items-center"
          }`}
        >
          {/* Vista de catálogo */}
          {showArticles === "catalogue"
            ? items.map((article, index) => (
                <div
                  key={article.id || index}
                  className="w-full max-w-sm flex justify-center"
                >
                  <CardArticles
                    article={article}
                    showPurchasePrice={showPurchasePrice}
                  />
                </div>
              ))
            : /* Vista de lista */
              items.map((article, index) => (
                <div
                  key={article.id || index}
                  className="w-full max-w-sm flex justify-center"
                >
                  <ListArticle
                    article={article}
                    showPurchasePrice={showPurchasePrice}
                  />
                </div>
              ))}

          {/* Carga de más artículos */}
          <div
            ref={observerRef}
            className="h-20 flex items-center justify-center w-full"
          >
            {isFetching && !showLoading && (
              <div className="text-center py-4 text-xs font-semibold">
                Cargando más artículos...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Articles;
