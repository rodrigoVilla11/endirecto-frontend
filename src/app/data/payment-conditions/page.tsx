"use client";
import React, { useState, useEffect, useRef } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaTimes } from "react-icons/fa";
import {
  useCountPaymentConditionsQuery,
  useGetPaymentConditionsPagQuery,
} from "@/redux/services/paymentConditionsApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // Estados básicos
  const [page, setPage] = useState(1);
  const [paymentConditions, setPaymentConditions] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Referencias
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux
  const { data: countPaymentConditionsData } = useCountPaymentConditionsQuery(null);
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetPaymentConditionsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
  });

  // Búsqueda con debounce
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setPaymentConditions([]);
    setHasMore(true);
  }, 100);

  // Efecto para manejar la carga inicial y las búsquedas
  useEffect(() => {
    const loadPaymentConditions = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newPaymentConditions = result || [];

          if (page === 1) {
            setPaymentConditions(newPaymentConditions);
          } else {
            setPaymentConditions((prev) => [...prev, ...newPaymentConditions]);
          }

          setHasMore(newPaymentConditions.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading payment conditions:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPaymentConditions();
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
    setPaymentConditions([]);
    setHasMore(true);
  };

  // Configuración de la tabla
  const tableData = paymentConditions?.map((payment_condition) => ({
    key: payment_condition.id,
    id: payment_condition.id,
    name: payment_condition.name,
    percentage: payment_condition.percentage,
    default: payment_condition.default,
  }));

  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    { name: "Percentage", key: "percentage" },
    { name: "Default", key: "default" },
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
      ? `${paymentConditions.length} Results`
      : `${countPaymentConditionsData || 0} Results`,
  };

  if (isQueryLoading && paymentConditions.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading payment conditions. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold p-4">PAYMENT CONDITIONS</h3>
        <Header headerBody={headerBody} />

        {isLoading && paymentConditions.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : paymentConditions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No payment conditions found
          </div>
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