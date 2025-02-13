"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaRegFilePdf } from "react-icons/fa";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import {
  useCountCollectionQuery,
  useGetCollectionsPagQuery,
} from "@/redux/services/collectionsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { format } from "date-fns";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import { useClient } from "@/app/context/ClientContext";
import debounce from "@/app/context/debounce";

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

  // Referencias
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

  // Evitar llamadas innecesarias a `refetch` cuando cambia selectedClientId
  useEffect(() => {
    if (selectedClientId !== customer_id) {
      setCustomer_id(selectedClientId || "");
      refetch();
    }
  }, [selectedClientId]);

  // Carga de datos con paginación y ordenamiento
  useEffect(() => {
    const loadItems = async () => {
      if (isLoading) return; // Evita llamadas innecesarias
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

  // Construcción de datos para la tabla
  const tableData = items?.map((collection) => {
    // Se usa el nuevo modelo: id, branchId, sellerId, etc.
    const branch = branchData?.find((data) => data.id === collection.branchId);
    const seller = sellersData?.find((data) => data.id === collection.sellerId);

    return {
      key: collection.id,
      info: (
        <div className="flex justify-center items-center">
          <AiOutlineDownload className="text-center text-xl" />
        </div>
      ),
      pdf: (
        <div className="flex justify-center items-center">
          <FaRegFilePdf className="text-center text-xl" />
        </div>
      ),
      number: collection.number,
      date: collection.date
        ? format(new Date(collection.date), "dd/MM/yyyy HH:mm")
        : "N/A",
      payment: "PESOS",
      amount: collection.amount,
      status: collection.status,
      notes: collection.notes,
      seller: seller?.name || "NOT FOUND",
    };
  });

  const tableHeader = [
    { component: <AiOutlineDownload className="text-center text-xl" />, key: "info" },
    { component: <FaRegFilePdf className="text-center text-xl" />, key: "pdf" },
    { name: "Number", key: "number", important: true },
    { name: "Date", key: "date" },
    { name: "Payment", key: "payment" },
    { name: "Amount", key: "amount",important: true },
    { name: "Status", key: "status",important: true },
    { name: "Notes", key: "notes" },
    { name: "Seller", key: "seller" },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <DatePicker
            selected={searchParams.startDate}
            onChange={(date) =>
              setSearchParams({ ...searchParams, startDate: date })
            }
            placeholderText="Date From"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      {
        content: (
          <DatePicker
            selected={searchParams.endDate}
            onChange={(date) =>
              setSearchParams({ ...searchParams, endDate: date })
            }
            placeholderText="Date To"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
    ],
    // Se utiliza data.total para mostrar la cantidad total de registros
    results: `${data?.total || 0} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">COLLECTIONS SUMMARIES</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0] || ""}
          sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
        />
      </div>
      <div ref={observerRef} className="h-10" />
    </PrivateRoute>
  );
};

export default Page;
