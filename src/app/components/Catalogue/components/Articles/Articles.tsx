import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Image from "next/image";
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

  // Ref para manejar el IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);
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

  // Reinicia los artículos si los filtros cambian
  useEffect(() => {
    if (prevFiltersRef.current !== filtersString) {
      setItems([]);
      setPage(1);
      setIsLoadingMore(false);
      prevFiltersRef.current = filtersString;
    }
  }, [filtersString]);

  // Agrega nuevos artículos y evita duplicados usando el id
  useEffect(() => {
    if (data?.articles) {
      setItems((prev) => {
        if (page === 1) return data.articles;
        const newArticles = data.articles.filter(
          (article: any) => !prev.some((item: any) => item.id === article.id)
        );
        return [...prev, ...newArticles];
      });
    }
  }, [data?.articles, page]);

  // Callback ref para el último elemento de la lista (scroll infinito)
  const lastArticleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetching) return;
      if (observerRef.current) observerRef.current.disconnect();

      // Solo se adjunta el observer si hay datos en la respuesta
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            // Si la respuesta actual tiene artículos, se asume que puede haber más
            if (data?.articles && data.articles.length > 0) {
              setIsLoadingMore(true);
              setPage((prevPage) => prevPage + 1);
            }
          }
        },
        { threshold: 0.5 }
      );

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetching, data]
  );

  // Cuando finaliza la carga, desactiva el indicador de "cargando más"
  useEffect(() => {
    if (!isFetching && isLoadingMore) {
      setIsLoadingMore(false);
    }
  }, [isFetching, isLoadingMore]);

  const showLoading = isLoading || (isFetching && page === 1);

  return (
    <div className="relative m-4 flex flex-col text-sm w-full max-w-[100vw] overflow-x-hidden">
      {/* Pantalla de carga inicial con logo */}
      {showLoading && page === 1 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-50 p-10">
          {/* Se usa priority para asegurar su carga */}
          <Image
            src="/dma.png"
            alt="Loading..."
            width={160}
            height={96}
            priority
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

      {/* Contenedor de artículos */}
      {items.length > 0 && (
        <>
          {showArticles === "catalogue" ? (
            <div className="grid gap-4 p-2 w-full grid-cols-[repeat(auto-fit,_minmax(120px,_1fr))] sm:grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] place-items-center">
              {items.map((article, index) => {
                if (index === items.length - 1) {
                  return (
                    <div
                      key={index}
                      ref={lastArticleRef}
                      className="max-w-xs w-full"
                    >
                      <CardArticles
                        article={article}
                        showPurchasePrice={showPurchasePrice}
                      />
                    </div>
                  );
                }
                return (
                  <div key={index} className="max-w-xs w-full">
                    <CardArticles
                      article={article}
                      showPurchasePrice={showPurchasePrice}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center p-2 w-full">
              {items.map((article, index) => {
                if (index === items.length - 1) {
                  return (
                    <div
                      key={ index}
                      ref={lastArticleRef}
                      className="w-full max-w-sm flex justify-center"
                    >
                      <ListArticle
                        article={article}
                        showPurchasePrice={showPurchasePrice}
                      />
                    </div>
                  );
                }
                return (
                  <div key={index} className="w-full max-w-sm flex justify-center">
                    <ListArticle
                      article={article}
                      showPurchasePrice={showPurchasePrice}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Indicador de carga para artículos adicionales */}
          {isFetching && page > 1 && (
            <div className="h-20 flex items-center justify-center w-full">
              <div className="flex justify-center items-center">
                <svg className="animate-spin h-6 w-6 text-black" viewBox="0 0 24 24">
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
                    d="M4 12a8 8 0 0116 0"
                  ></path>
                </svg>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Articles;
