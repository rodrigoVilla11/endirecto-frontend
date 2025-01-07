"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import {
  useCountSellersQuery,
  useGetSellersPagQuery,
} from "@/redux/services/sellersApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import debounce from "@/app/context/debounce";
import { FaTimes } from "react-icons/fa";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // Estados básicos
  const [page, setPage] = useState(1);
  const [sellers, setSellers] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Referencias
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux (mantenidas como estaban)
  const { data: branchsData } = useGetBranchesQuery(null);
  const { data: countSellersData } = useCountSellersQuery(null);
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetSellersPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
  });

  // Búsqueda con debounce
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setSellers([]);
    setHasMore(true);
  }, 100);

  // Efecto para manejar la carga inicial y las búsquedas
  useEffect(() => {
    const loadSellers = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newSellers = result || [];

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
  }, [page, searchQuery]);

  // Intersection Observer para scroll infinito
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
    setSellers([]);
    setHasMore(true);
  };

  const tableData = sellers?.map((seller) => ({
    key: seller.id,
    id: seller.id,
    name: seller.name,
    branch_id: branchsData?.find((b) => b.id === seller.branch_id)?.name || "NO BRANCH",
  }));

  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    { name: "Branch", key: "branch" },
  ];
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
    results: searchQuery
      ? `${data?.length || 0} Results`
      : `${countSellersData || 0} Results`,
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
            <Table headers={tableHeader} data={tableData} />
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
