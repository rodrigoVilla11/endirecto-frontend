"use client";
import React, { useState, useEffect, useRef } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetSearchesPagQuery } from "@/redux/services/searchesApi";
import { useTranslation } from "react-i18next";
import PrivateRoute from "@/app/context/PrivateRoutes";

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
  });

  // Ref para el Intersection Observer (infinite scroll)
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Efecto para cargar searches y acumular los resultados
  useEffect(() => {
    const loadSearches = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          console.log("API result:", result);
          const newSearches = result.searches || result;
          console.log("New searches:", newSearches);
          if (page === 1) {
            setItems(newSearches);
          } else {
            setItems((prev) => [...prev, ...newSearches]);
          }
          setHasMore(Array.isArray(newSearches) && newSearches.length === limit);
        } catch (err) {
          console.error("Error loading searches:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadSearches();
  }, [page, searchQuery, refetch, limit]);
  

  // Efecto para implementar infinite scroll con Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    const currentObserver = observerRef.current;
    if (currentObserver) {
      observer.observe(currentObserver);
    }
    return () => {
      if (currentObserver) {
        observer.unobserve(currentObserver);
      }
    };
  }, [hasMore, isLoading]);

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
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
