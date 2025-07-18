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
import { useAuth } from "@/app/context/AuthContext";

const ITEMS_PER_PAGE = 15;

const VouchersComponent = () => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const userRole = userData?.role ? userData.role.toUpperCase() : "";

  // Estados básicos
  const [page, setPage] = useState(1);
  const [limit] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  // Para el filtro de cliente, se utiliza selectedClientId si existe
  const { selectedClientId } = useClient();
  const [customer_id, setCustomer_id] = useState("");
  const [sortQuery, setSortQuery] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [totalDocuments, setTotalDocuments] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);

  // Estados para los nuevos filtros
  const [typeFilter, setTypeFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");

  // Estados para modal de documento
  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );

  // Si existe un selectedClientId, se utiliza para filtrar
  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
    }
  }, [selectedClientId]);

  // Si el usuario es VENDEDOR, forzamos el filtro de vendedor
  useEffect(() => {
    if (userRole === "VENDEDOR" && userData?.seller_id) {
      setSellerFilter(userData.seller_id);
    }
  }, [userRole, userData]);

  // Consulta de clientes y vendedores
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);

  // Consulta RTK Query para documentos paginados
  const { refetch, isLoading, error } = useGetDocumentsPagQuery({
    page,
    limit,
    query: searchQuery,
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
    customer_id,
    sort: sortQuery,
    type: typeFilter,
    seller_id: userRole === "VENDEDOR" ? userData?.seller_id : sellerFilter,
  });

  // Debounced search para optimizar la búsqueda
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setItems([]);
  }, 100);

  // Cargar documentos cada vez que cambian filtros o página
  useEffect(() => {
    const loadDocuments = async () => {
      if (isFetching) return;
      setIsFetching(true);
      try {
        const result = await refetch().unwrap();
        const fetched = result || { documents: [], total: 0 };
        const newDocs = Array.isArray(fetched.documents)
          ? fetched.documents
          : [];
        setTotalDocuments(fetched.total || 0);

        setItems(prev =>
          page === 1 ? newDocs : [...prev, ...newDocs]
        );
      } catch (err) {
        console.error(t("errorLoadingDocuments"), err);
      } finally {
        setIsFetching(false);
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
    typeFilter,
    sellerFilter,
    refetch,
    t,
  ]);

  // Infinite scroll: observa el div sentinel y aumenta página si hay más
  const observerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        const hasMore = items.length < totalDocuments;
        if (entry.isIntersecting && !isFetching && hasMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [isFetching, items.length, totalDocuments]);

  // Handlers de reset
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setItems([]);
  };
  const handleResetDate = () => {
    setStartDate(null);
    setEndDate(null);
    setPage(1);
    setItems([]);
  };

  // Ordenamiento
  const handleSort = useCallback(
    (field: string) => {
      const [f, d] = sortQuery.split(":");
      const dir = f === field && d === "asc" ? "desc" : "asc";
      setSortQuery(`${field}:${dir}`);
      setPage(1);
      setItems([]);
    },
    [sortQuery]
  );

  // Modal de documento
  const openDocumentModal = (id: string) => {
    setSelectedDocumentId(id);
    setDocumentModalOpen(true);
  };
  const closeDocumentModal = () => {
    setDocumentModalOpen(false);
    setSelectedDocumentId(null);
  };

  // Preparar datos para la tabla
  const tableData = items.map(doc => {
    const customer = customersData?.find(c => c.id === doc.customer_id);
    const seller = sellersData?.find(s => s.id === doc.seller_id);
    return {
      key: doc.id,
      action: (
        <div className="flex justify-center items-center">
          <IoInformationCircleOutline
            className="text-xl cursor-pointer"
            onClick={() => openDocumentModal(doc.id)}
          />
        </div>
      ),
      customer: customer
        ? `${customer.id} - ${customer.name}`
        : t("notFound"),
      type: doc.type,
      number: doc.number,
      date: doc.date,
      amount: doc.amount,
      balance: doc.amount,
      expiration: doc.expiration_date,
      logistic: doc.expiration_status,
      seller: seller?.name || t("notFound"),
    };
  });

  // Filtros extra en el header
  const headerFilters = [
    {
      content: (
        <select
          value={typeFilter}
          onChange={e => {
            setTypeFilter(e.target.value);
            setPage(1);
            setItems([]);
          }}
          className="border border-gray-300 rounded p-2"
        >
          <option value="">{t("allTypes")}</option>
          <option value="FACTURA A">FACTURA A</option>
          <option value="FACTURA B">FACTURA B</option>
          <option value="Nota de Crédito A">Nota de Crédito A</option>
          <option value="Nota de Crédito B">Nota de Crédito B</option>
          <option value="Recibo de cobranza">Recibo de cobranza</option>
        </select>
      ),
    },
    {
      content: (
        <select
          value={userRole === "VENDEDOR" ? userData?.seller_id : sellerFilter}
          onChange={e => {
            if (userRole !== "VENDEDOR") {
              setSellerFilter(e.target.value);
              setPage(1);
              setItems([]);
            }
          }}
          className="border border-gray-300 rounded p-2"
          disabled={userRole === "VENDEDOR"}
        >
          <option value="">{t("allSellers")}</option>
          {sellersData?.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      content: (
        <select
          value={selectedClientId || customer_id}
          onChange={e => {
            setCustomer_id(e.target.value);
            setPage(1);
            setItems([]);
          }}
          className="border border-gray-300 rounded p-2"
          disabled={Boolean(selectedClientId)}
        >
          <option value="">{t("allCustomers")}</option>
          {customersData?.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ),
    },
  ];

  // Configuración del header principal
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
          <div className="flex space-x-2">
            <DatePicker
              selected={startDate}
              onChange={date => {
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
              onChange={date => {
                setEndDate(date);
                setPage(1);
                setItems([]);
                refetch();
              }}
              placeholderText={t("dateTo")}
              dateFormat="yyyy-MM-dd"
              className="border border-gray-300 rounded p-2"
            />
          </div>
        ),
      },
      ...headerFilters,
    ],
    results: searchQuery
      ? t("results", { count: items.length })
      : t("results", { count: totalDocuments }),
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
        <Header headerBody={headerBody} />
        <Table
          headers={[
            { name: t("action"), key: "action" },
            {
              component: <IoInformationCircleOutline className="text-xl" />,
              key: "info",
            },
            { name: t("customer"), key: "customer" },
            { name: t("type"), key: "type" },
            { name: t("number"), key: "number", important: true },
            { name: t("date"), key: "date" },
            { name: t("amount"), key: "amount" },
            { name: t("balance"), key: "balance" },
            { name: t("expiration"), key: "expiration" },
            { name: t("logistic"), key: "logistic" },
            { name: t("seller"), key: "seller" },
          ]}
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
