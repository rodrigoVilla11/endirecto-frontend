"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { FaTimes } from "react-icons/fa";
import { useGetPaymentConditionsPagQuery } from "@/redux/services/paymentConditionsApi";
import debounce from "@/app/context/debounce";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // Estados básicos
  const [page, setPage] = useState(1);
  const [paymentConditions, setPaymentConditions] = useState<any[]>([]);
  const [totalPaymentConditions, setTotalPaymentConditions] =
    useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  // Referencias para Observer y Loading
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Query de Redux
  // Se asume que useGetPaymentConditionsPagQuery retorna un objeto { paymentConditions, total }
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetPaymentConditionsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortQuery,
  });

  // Debounced search para evitar disparar la búsqueda con cada tecla
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setPaymentConditions([]);
    setHasMore(true);
  }, 100);

  // Efecto para cargar la data e ir actualizando los estados: tanto la lista paginada como el total global
  useEffect(() => {
    const loadPaymentConditions = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          // Se espera que el resultado tenga la forma { paymentConditions, total }
          const result = await refetch().unwrap();
          const fetchedData = result || { paymentConditions: [], total: 0 };
          const newPaymentConditions = Array.isArray(
            fetchedData.paymentConditions
          )
            ? fetchedData.paymentConditions
            : [];
          setTotalPaymentConditions(fetchedData.total || 0);
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
    setPaymentConditions([]);
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
      setPaymentConditions([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  // Configuración de la tabla
  const tableData = paymentConditions.map((payment_condition) => ({
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

  // Configuración del header:
  // Si se está buscando, se muestra el total de la página actual (paymentConditions.length);
  // en caso contrario se muestra el total global obtenido de la query.
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
    results: `${totalPaymentConditions} Results`,
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
