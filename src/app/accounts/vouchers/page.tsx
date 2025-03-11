"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetDocumentsPagQuery } from "@/redux/services/documentsApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useClient } from "@/app/context/ClientContext";
import debounce from "@/app/context/debounce";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const VouchersComponent = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [limit] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const { selectedClientId } = useClient();
  const [customer_id, setCustomer_id] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [totalDocuments, setTotalDocuments] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  // Estados para modales y documento seleccionado
  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );

  // Referencias para Intersection Observer
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data, error, isLoading, refetch } = useGetDocumentsPagQuery({
    page,
    limit,
    query: searchQuery,
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
    customer_id,
    sort: sortQuery,
  });

  // Actualiza customer_id según selectedClientId
  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch();
    } else {
      setCustomer_id("");
      refetch();
    }
  }, [selectedClientId, refetch]);

  // Debounced search para optimizar la búsqueda
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setItems([]);
  }, 100);

  // Efecto para cargar documentos (incluye paginación, búsqueda, infinite scroll)
  useEffect(() => {
    const loadDocuments = async () => {
      if (!isFetching) {
        setIsFetching(true);
        try {
          // Se espera que la respuesta tenga la forma: { documents: Document[], total: number }
          const result = await refetch().unwrap();
          const fetchedData = result || { documents: [], total: 0 };
          const newItems = Array.isArray(fetchedData.documents)
            ? fetchedData.documents
            : [];
          setTotalDocuments(fetchedData.total || 0);
          if (page === 1) {
            setItems(newItems);
          } else {
            setItems((prev) => [...prev, ...newItems]);
          }
        } catch (err) {
          console.error(t("errorLoadingDocuments"), err);
        } finally {
          setIsFetching(false);
        }
      }
    };

    loadDocuments();
  }, [
    page,
    searchQuery,
    startDate,
    endDate,
    customer_id,
    sortQuery,
    refetch,
    isFetching,
    t,
  ]);

  // Intersection Observer para infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && !isFetching) {
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
  }, [isFetching]);

  // Reset de búsqueda
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setItems([]);
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
      setItems([]);
    },
    [sortQuery]
  );

  // Mapeo de los documentos para la tabla
  const tableData = items?.map((document) => {
    const customer = customersData?.find(
      (data) => data.id === document.customer_id
    );
    const seller = sellersData?.find((data) => data.id === document.seller_id);
    return {
      key: document.id,
      id: (
        <div className="flex justify-center items-center">
          <IoInformationCircleOutline
            className="text-center text-xl"
            onClick={() => {
              setSelectedDocumentId(document.id);
              setDocumentModalOpen(true);
            }}
          />
        </div>
      ),
      customer: customer ? `${customer.id} - ${customer.name}` : t("notFound"),
      type: document.type,
      number: document.number,
      date: document.date,
      amount: document.amount,
      balance: document.amount,
      expiration: document.expiration_date,
      logistic: document.expiration_status,
      seller: seller?.name || t("notFound"),
    };
  });

  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: t("customer"), key: "customer", important: true },
    { name: t("type"), key: "type" },
    { name: t("number"), key: "number", important: true },
    { name: t("date"), key: "date" },
    { name: t("amount"), key: "amount" },
    { name: t("balance"), key: "balance" },
    { name: t("expiration"), key: "expiration" },
    { name: t("logistic"), key: "logistic" },
    { name: t("seller"), key: "seller" },
  ];

  // Configuración del header
  const headerBody = {
    buttons: [{ logo: <AiOutlineDownload />, title: t("download") }],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                debouncedSearch(e.target.value)
              }
              onKeyDown={(e: any) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setItems([]);
                  refetch();
                }
              }}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleResetSearch}
                aria-label={t("clearSearch")}
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
      {
        content: (
          <>
            <DatePicker
              selected={startDate}
              onChange={(date) => {
                setStartDate(date);
                setPage(1);
                setItems([]);
                refetch();
              }}
              placeholderText={t("dateFrom")}
              dateFormat="yyyy-MM-dd"
              className="border border-gray-300 rounded p-2"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => {
                setEndDate(date);
                setPage(1);
                setItems([]);
                refetch();
              }}
              placeholderText={t("dateTo")}
              dateFormat="yyyy-MM-dd"
              className="border border-gray-300 rounded p-2"
            />
          </>
        ),
      },
    ],
    results: searchQuery
      ? `${items.length} ${t("results")}`
      : `${totalDocuments || 0} ${t("results")}`,
  };

  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (error) {
    return <div className="p-4 text-red-500">{t("errorLoadingDocuments")}</div>;
  }

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("statusHeader")}</h3>
        {/* Se muestra el total según los filtros */}
        <div className="p-4"></div>
        <Header headerBody={headerBody} />
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0]}
          sortOrder={(sortQuery.split(":")[1] as "asc" | "desc") || ""}
        />
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default VouchersComponent;
