"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { FaTimes } from "react-icons/fa";
import { useGetSellersPagQuery } from "@/redux/services/sellersApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import debounce from "@/app/context/debounce";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [sellers, setSellers] = useState<any[]>([]);
  const [totalSellers, setTotalSellers] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  // Referencias para observer y loading
   const observerRef = useRef<IntersectionObserver | null>(null);
 

  // Queries de Redux
  const { data: branchsData } = useGetBranchesQuery(null);
  // Se espera que useGetSellersPagQuery retorne { sellers, total }
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetSellersPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortQuery,
  },
  {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setSellers([]);
    setHasMore(true);
  }, 100);

   // ======================================================
   // Efectos
   // ======================================================
   // Actualizar lista de artículos y evitar duplicados
   useEffect(() => {
     if (data?.sellers) {
       setSellers((prev) => {
         if (page === 1) {
           return data.sellers;
         }
         const newArticles = data.sellers.filter(
           (article) => !prev.some((item) => item.id === article.id)
         );
         return [...prev, ...newArticles];
       });
       setHasMore(data.sellers.length === ITEMS_PER_PAGE);
     }
   }, [data?.sellers, page]);
 
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
    setSellers([]);
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
      setSellers([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  // Configuración de la tabla
  const tableData = sellers.map((seller) => {
    const branch = branchsData?.find((b) => b.id === seller.branch_id);
    return {
      key: seller.id,
      id: seller.id,
      name: seller.name,
      branch: branch?.name || t("table.noBranch"),
    };
  });

  const tableHeader = [
    { name: t("table.id"), key: "id", important: true },
    { name: t("table.name"), key: "name", important: true, sortable: true  },
    { name: t("table.branch"), key: "branch", important: true },
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

  if (isQueryLoading && sellers.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-red-500">
        {t("page.errorLoadingSellers")}
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("page.sellersTitle")}</h3>
        <Header headerBody={headerBody} />
        {isLoading && sellers.length === 0 ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("page.noSellersFound")}
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
