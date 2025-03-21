"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { FaTimes } from "react-icons/fa";
import { useGetStockPagQuery } from "@/redux/services/stockApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import debounce from "@/app/context/debounce";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [stock, setStock] = useState<any[]>([]);
  const [totalStock, setTotalStock] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  // Referencias para Observer y Loading
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Queries de Redux
  const { data: branchData } = useGetBranchesQuery(null);
  // Se espera que useGetStockPagQuery retorne { stocks, total }
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetStockPagQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      sort: sortQuery,
    },
    {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // Debounced search para optimizar la búsqueda
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setStock([]);
    setHasMore(true);
  }, 100);

   // ======================================================
   // Efectos
   // ======================================================
   // Actualizar lista de artículos y evitar duplicados
   useEffect(() => {
     if (data?.stocks) {
       setStock((prev) => {
         if (page === 1) {
           return data.stocks;
         }
         const newArticles = data.stocks.filter(
           (article) => !prev.some((item) => item.id === article.id)
         );
         return [...prev, ...newArticles];
       });
       setHasMore(data.stocks.length === ITEMS_PER_PAGE);
     }
   }, [data?.stocks, page]);
 
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
  // Reset de búsqueda
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setStock([]);
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
      setStock([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  // Configuración de la tabla
  const tableData = stock?.map((stockItem) => {
    const branch = branchData?.find((data) => data.id === stockItem.branch_id);
    return {
      key: stockItem.id,
      id: stockItem.id,
      article_id: stockItem.article_id,
      quantity: stockItem.quantity,
      branch: branch?.name || t("table.unknownBranch"),
      quantity_next: stockItem.quantity_next,
      quantity_next_date: stockItem.quantity_next_date,
    };
  });

  const tableHeader = [
    { name: t("table.id"), key: "id", important: true },
    {
      name: t("table.article"),
      key: "article_id",
      important: true,
      sortable: true,
    },
    {
      name: t("table.quantity"),
      key: "quantity",
      important: true,
      sortable: true,
    },
    { name: t("table.branch"), key: "branch" },
    { name: t("table.nextEntry"), key: "quantity_next" },
    { name: t("table.dateNextEntry"), key: "quantity_next_date" },
  ];

  // Configuración del header
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
    results: t("page.results", { count: data?.total }),
  };

  if (isQueryLoading && stock.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-red-500">{t("page.errorLoadingStock")}</div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold p-4">{t("page.stockTitle")}</h3>
        <Header headerBody={headerBody} />
        {isLoading && stock.length === 0 ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : stock.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("page.noStockFound")}
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
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}
        <div ref={lastArticleRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
