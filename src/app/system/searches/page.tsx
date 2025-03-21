"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetSearchesPagQuery } from "@/redux/services/searchesApi";
import { useTranslation } from "react-i18next";
import PrivateRoute from "@/app/context/PrivateRoutes";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Se asume que el query retorna un objeto con { searches: Search[], total: number }
  const { data, error, isLoading: isQueryLoading, refetch } = useGetSearchesPagQuery({
    page,
    limit,
    query: searchQuery,
  },
  {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  // Ref para el Intersection Observer (infinite scroll)
    const observerRef = useRef<IntersectionObserver | null>(null);
  

   // ======================================================
   // Efectos
   // ======================================================
   // Actualizar lista de artículos y evitar duplicados
   useEffect(() => {
     if (data?.searches) {
       setItems((prev) => {
         if (page === 1) {
           return data.searches;
         }
         const newArticles = data.searches.filter(
           (article) => !prev.some((item: any) => item.id === article._id)
         );
         return [...prev, ...newArticles];
       });
       setHasMore(data.searches.length === ITEMS_PER_PAGE);
     }
   }, [data?.searches, page]);
 
   // ======================================================
   // Infinite Scroll (Intersection Observer)
   // ======================================================
   const lastArticleRef = useCallback(
     (node: HTMLDivElement | null) => {
       if (observerRef.current) observerRef.current.disconnect();
 
       observerRef.current = new IntersectionObserver(
         (entries) => {
           if (entries[0].isIntersecting && hasMore && !isQueryLoading) {
             setPage((prev) => prev + 1);
           }
         },
         { threshold: 0.0, rootMargin: "200px" } // Se dispara 200px antes de que el sentinel esté visible
       );
 
       if (node) observerRef.current.observe(node);
     },
     [hasMore, isQueryLoading]
   );

  // Mapear los searches para la tabla (asegurándonos de que items sea un arreglo)
  const tableData = Array.isArray(items) ? items.map((search) => ({
    key: search._id,
    search: search.search,
    quantity: search.quantity,
  })) : [];

  // Definir encabezados de la tabla
  const tableHeader = [
    { name: t("table.search"), key: "search", important: true },
    { name: t("table.quantity"), key: "quantity" },
  ];

  // Configuración del header, incluye el input para búsqueda
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <Input
            placeholder={t("page.searchPlaceholder")}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              // Reiniciamos la página al cambiar la búsqueda
              setPage(1);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                setPage(1);
                refetch();
              }
            }}
          />
        ),
      },
    ],
    results: searchQuery
      ? t("page.results", { count: items.length })
      : t("page.results", { count: data?.total || items.length }),
  };

  if (isQueryLoading && page === 1) return <p>{t("page.loading")}</p>;

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("page.searchesTitle")}</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        {/* Elemento observado para disparar la carga de la siguiente página */}
        <div ref={lastArticleRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
