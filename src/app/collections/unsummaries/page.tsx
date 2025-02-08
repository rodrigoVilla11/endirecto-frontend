"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import {
  useCountCollectionQuery,
  useGetCollectionsPagQuery,
} from "@/redux/services/collectionsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { format } from "date-fns";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useClient } from "@/app/context/ClientContext";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // Estados básicos
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"
  const [customer_id, setCustomer_id] = useState("");
  const { selectedClientId } = useClient();

  // Referencia para el IntersectionObserver
  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data: sellersData } = useGetSellersQuery(null);
  const [searchParams, setSearchParams] = useState({
    seller_id: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetCollectionsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    status: "SUMMARIZED",
    startDate: searchParams.startDate ? searchParams.startDate.toISOString() : undefined,
    endDate: searchParams.endDate ? searchParams.endDate.toISOString() : undefined,
    seller_id: searchParams.seller_id,
    customer_id,
    sort: sortQuery,
  });

  const { data: countCollectionsData } = useCountCollectionQuery(null);
  const { data: branchData } = useGetBranchesQuery(null);

  // Actualización de customer_id cuando cambia selectedClientId
  useEffect(() => {
    if (selectedClientId !== customer_id) {
      setCustomer_id(selectedClientId || "");
      refetch();
    }
  }, [selectedClientId]);

  // Carga de datos con paginación y ordenamiento
  useEffect(() => {
    const loadItems = async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        const result = await refetch().unwrap();
        // Extraemos las collections de la respuesta
        const newItems = result.collections || [];
        setItems((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
        setHasMore(newItems.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error("Error loading collections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [page, sortQuery]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [hasMore, isLoading]);

  // Manejo de ordenamiento
  const handleSort = useCallback(
    (field: string) => {
      setPage(1);
      setItems([]);
      setHasMore(true);

      const [currentField, currentDirection] = sortQuery
        ? sortQuery.split(":")
        : ["", ""];

      setSortQuery(
        currentField === field
          ? `${field}:${currentDirection === "asc" ? "desc" : "asc"}`
          : `${field}:asc`
      );
    },
    [sortQuery]
  );

  // Construcción de datos para la tabla usando el nuevo modelo
  const tableData = items?.map((collection) => {
    // Se asume que el nuevo modelo usa: id, branchId, sellerId, date y amount
    const branch = branchData?.find((data) => data.id === collection.branchId);
    const seller = sellersData?.find((data) => data.id === collection.sellerId);

    return {
      key: collection.id,
      branch: branch?.name || "NOT FOUND",
      seller: seller?.name || "NOT FOUND",
      date: collection.date
        ? format(new Date(collection.date), "dd/MM/yyyy HH:mm")
        : "N/A",
      value: "PESOS",
      amount: collection.amount,
    };
  });

  // Cálculo del total
  const sumAmountsDataFilter = tableData?.reduce((acc, doc) => acc + doc.amount, 0);
  const formatedSumAmountFilter = sumAmountsDataFilter?.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const tableHeader = [
    { name: "Branch", key: "branch" },
    { name: "Seller", key: "seller" },
    { name: "Date", key: "date" },
    { name: "Value", key: "value" },
    { name: "Amount", key: "amount" },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <select
            value={searchParams.seller_id}
            onChange={(e) =>
              setSearchParams({ ...searchParams, seller_id: e.target.value })
            }
          >
            <option value="">Seller...</option>
            {sellersData?.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>
        ),
      },
    ],
    secondSection: {
      title: "Total",
      amount: formatedSumAmountFilter || "N/A",
    },
    // Se utiliza data.total para mostrar la cantidad total de registros
    results: `${data?.total || 0} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">COLLECTIONS UNSUMMARIES</h3>
        <Header headerBody={headerBody} />
        {isQueryLoading && items.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">
            Error loading items. Please try again later.
          </div>
        ) : (
          <>
            <Table
              headers={tableHeader}
              data={tableData}
              onSort={handleSort}
              sortField={sortQuery.split(":")[0] || ""}
              sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
            />
            <div ref={observerRef} className="h-10" />
          </>
        )}
      </div>
    </PrivateRoute>
  );
};

export default Page;
