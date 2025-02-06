import React, { useEffect, useRef, useState } from "react";
import CardArticles from "./components/CardArticles";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import ListArticle from "./components/ListArticle";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";

const Articles = ({
  brand,
  item,
  vehicleBrand,
  stock,
  tags,
  cart,
  order,
  showPurchasePrice,
  showArticles,
  query,
}: any) => {
  // Estado de paginación
  const [page, setPage] = useState(1);
  // Estado de filtros (incluye el orden en "sort")
  const [filters, setFilters] = useState({
    brand,
    item,
    vehicleBrand,
    stock,
    tags,
    query,
    sort: order,
  });
  // Estado para almacenar los artículos cargados
  const [items, setItems] = useState<any[]>([]);

  const { selectedClientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  // Usamos el estado "isLoading" del query para saber si está cargando
  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page,
    limit: 20,
    priceListId: customer?.price_list_id,
    ...filters,
  });

  const { isOpen } = useSideMenu();
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Efecto para actualizar los artículos cuando llegan nuevos datos
  useEffect(() => {
    if (data && data.articles) {
      if (page === 1) {
        setItems(data.articles);
      } else {
        setItems((prev) => [...prev, ...data.articles]);
      }
    }
  }, [data, page]);

  // Efecto para reiniciar la paginación y los artículos cuando cambian los filtros
  useEffect(() => {
    setPage(1);
    setItems([]); // Borra los artículos anteriores
    setFilters({
      brand,
      item,
      vehicleBrand,
      stock,
      tags,
      query,
      sort: order, // Actualiza el orden recibido
    });
  }, [brand, item, vehicleBrand, stock, tags, query, order]);

  // Efecto para la paginación infinita mediante IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Si el elemento es visible y no estamos cargando, incrementamos la página
        if (entry.isIntersecting && !isLoading) {
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
  }, [isLoading]);

  return (
    <div className="h-full m-4 flex flex-col text-sm relative">
      {/* Spinner centrado mientras se cargan los datos */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
          {/* Puedes usar una imagen personalizada o un ícono */}
          <img
            src="/loading-spinner.gif" // O usa un ícono: <FaSpinner className="text-4xl text-gray-500 animate-spin" />
            alt="Loading..."
            className="h-16 w-16"
          />
        </div>
      )}

      {/* Solo se muestran los artículos si no se está cargando */}
      {!isLoading && items.length > 0 && (
        <>
          {showArticles === "catalogue" ? (
            <div
              className={`overflow-auto no-scrollbar h-[calc(100vh-10px)] grid gap-6 justify-items-center ${
                isOpen
                  ? "grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))]"
                  : "grid-cols-[repeat(auto-fit,_minmax(220px,_1fr))]"
              }`}
            >
              {items.map((article: any, index: number) => (
                <CardArticles
                  key={index}
                  article={article}
                  showPurchasePrice={showPurchasePrice}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-auto no-scrollbar h-[calc(100vh-10px)]">
              {items.map((article: any, index: number) => (
                <ListArticle
                  key={index}
                  article={article}
                  showPurchasePrice={showPurchasePrice}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Detector para Infinite Scroll */}
      <div ref={observerRef} className="h-100" />
    </div>
  );
};

export default Articles;
