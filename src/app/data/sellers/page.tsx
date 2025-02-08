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

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // Estados básicos
  const [page, setPage] = useState(1);
  const [sellers, setSellers] = useState<any[]>([]);
  const [totalSellers, setTotalSellers] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  // Referencias para observer y loading
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

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
  });

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setSellers([]);
    setHasMore(true);
  }, 100);

  // Efecto para cargar los Sellers (paginación, búsqueda, infinite scroll)
  useEffect(() => {
    const loadSellers = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          // Se espera que el resultado tenga la forma: { sellers: Seller[], total: number }
          const result = await refetch().unwrap();
          const newSellers = Array.isArray(result.sellers)
            ? result.sellers
            : [];
          setTotalSellers(result.total || 0);
          if (page === 1) {
            setSellers(newSellers);
          } else {
            setSellers((prev) => [...prev, ...newSellers]);
          }
          setHasMore(newSellers.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading sellers:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadSellers();
  }, [page, searchQuery, sortQuery, refetch, isLoading]);

  // Intersection Observer para infinite scroll
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
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, isLoading]);

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
      branch: branch?.name || "NO BRANCH",
    };
  });

  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    { name: "Branch", key: "branch" },
  ];

  // Configuración del header: cuando hay búsqueda se usa la longitud local,
  // de lo contrario se muestra el total global retornado por el endpoint.
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
    results: `${totalSellers} Results`,
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
        Error loading sellers. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">SELLERS</h3>
        <Header headerBody={headerBody} />
        {isLoading && sellers.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No sellers found</div>
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
