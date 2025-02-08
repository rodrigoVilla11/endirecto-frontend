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

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // Estados básicos
  const [page, setPage] = useState(1);
  const [stock, setStock] = useState<any[]>([]);
  const [totalStock, setTotalStock] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  // Referencias para Observer y Loading
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux
  const { data: branchData } = useGetBranchesQuery(null);
  // Se espera que useGetStockPagQuery retorne { stocks, total }
  const { data, error, isLoading: isQueryLoading, refetch } = useGetStockPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortQuery,
  });

  // Debounced search para optimizar la búsqueda
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setStock([]);
    setHasMore(true);
  }, 100);

  // Efecto para cargar la data (infinite scroll y búsquedas)
  useEffect(() => {
    const loadStock = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          // Se espera que el resultado tenga la forma: { stocks, total }
          const result = await refetch().unwrap();
          const newStock = Array.isArray(result.stocks) ? result.stocks : [];
          setTotalStock(result.total || 0);
          if (page === 1) {
            setStock(newStock);
          } else {
            setStock((prev) => [...prev, ...newStock]);
          }
          setHasMore(newStock.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading stock:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadStock();
  }, [page, searchQuery, sortQuery, refetch, isLoading]);

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
    setStock([]);
    setHasMore(true);
  };

  // Handler para ordenamiento
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSortQuery = "";
      if (currentField === field) {
        newSortQuery = currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
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
      branch: branch?.name || "Unknown Branch",
      quantity_next: stockItem.quantity_next,
      quantity_next_date: stockItem.quantity_next_date,
    };
  });

  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Article", key: "article_id" },
    { name: "Quantity", key: "quantity" },
    { name: "Branch", key: "branch" },
    { name: "Next Entry", key: "quantity_next" },
    { name: "Date Next Entry", key: "quantity_next_date" },
  ];

  // Configuración del header
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder="Search..."
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
                aria-label="Clear search"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: `${totalStock} Results`,
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
      <div className="p-4 text-red-500">
        Error loading stock data. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold p-4">STOCK</h3>
        <Header headerBody={headerBody} />
        {isLoading && stock.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : stock.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No stock data found
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
