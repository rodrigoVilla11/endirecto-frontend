"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { FaTimes } from "react-icons/fa";
import { useCountTransportsQuery, useGetTransportsPagQuery } from "@/redux/services/transportsApi";
import debounce from "@/app/context/debounce";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [transports, setTransports] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  // Referencias
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux
  const { data: countTransportsData } = useCountTransportsQuery(null);
  const { data, error, isLoading: isQueryLoading, refetch } = useGetTransportsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortQuery,
  });

  // Búsqueda con debounce
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setTransports([]);
    setHasMore(true);
  }, 100);

  // Efecto para cargar los transports (infinite scroll y búsqueda)
  useEffect(() => {
    const loadTransports = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newTransports = result || [];
          if (page === 1) {
            setTransports(newTransports);
          } else {
            setTransports((prev) => [...prev, ...newTransports]);
          }
          setHasMore(newTransports.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading transports:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadTransports();
  }, [page, searchQuery, sortQuery]);

  // Intersection Observer para el infinite scroll
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

  // Reset de búsqueda
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setTransports([]);
    setHasMore(true);
  };

  // Handler para ordenamiento
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSortQuery = "";
      if (currentField === field) {
        newSortQuery =
          currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
        newSortQuery = `${field}:asc`;
      }
      setSortQuery(newSortQuery);
      setPage(1);
      setTransports([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  // Configuración de la tabla
  const tableData = transports?.map((transport) => ({
    key: transport.id,
    id: transport.id,
    name: transport.name,
    schedules: transport.schedule,
  }));

  const tableHeader = [
    { name: t("table.id"), key: "id", important: true },
    { name: t("table.name"), key: "name", important: true },
    { name: t("table.schedules"), key: "schedules" },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder={t("page.searchPlaceholder")}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                debouncedSearch(e.target.value)
              }
              className="pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleResetSearch}
                aria-label={t("page.clearSearch")}
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: searchQuery
      ? t("page.results", { count: transports.length })
      : t("page.results", { count: countTransportsData || 0 }),
  };

  if (isQueryLoading && transports.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {t("page.errorLoadingTransports")}
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold p-4">{t("page.transportsTitle")}</h3>
        <Header headerBody={headerBody} />
        {isLoading && transports.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : transports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("page.noTransportsFound")}
          </div>
        ) : (
          <>
            <Table
              headers={tableHeader}
              data={tableData}
              onSort={handleSort}
              sortField={sortQuery.split(":")[0]}
              sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
            />
            {isLoading && (
              <div ref={loadingRef} className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
