"use client";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import {
  useGetDocumentsPagQuery,
  useLazyExportDocumentsQuery,
} from "@/redux/services/documentsApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useClient } from "@/app/context/ClientContext";
import debounce from "@/app/context/debounce";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/context/AuthContext";
import { useGetUsersQuery } from "@/redux/services/usersApi";
import DocumentDetailsModal from "./DocumentDetailsModal";

// Constants
const ITEMS_PER_PAGE = 15;
const DEBOUNCE_DELAY = 300;
const DOCUMENT_TYPES = [
  "FACTURA A",
  "FACTURA B",
  "Nota de Crédito A",
  "Nota de Crédito B",
  "Recibo de cobranza",
];

// Types
interface DocumentFilters {
  page: number;
  searchQuery: string;
  startDate: Date | null;
  endDate: Date | null;
  customer_id: string;
  sortQuery: string;
  typeFilter: string;
  sellerFilter: string;
}

interface Document {
  id: string;
  customer_id: string;
  seller_id: string;
  type: string;
  number: string;
  date: string;
  amount: string;
  expiration_date: string;
  expiration_status: string;
}

const VouchersComponent = () => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const { selectedClientId } = useClient();

  const userRole = userData?.role?.toUpperCase() || "";
  const isVendedor = userRole === "VENDEDOR";

  // Core states
  const [filters, setFilters] = useState<DocumentFilters>({
    page: 1,
    searchQuery: "",
    startDate: null,
    endDate: null,
    customer_id: "",
    sortQuery: "",
    typeFilter: "",
    sellerFilter: "",
  });

  const [items, setItems] = useState<Document[]>([]);
  const [totalDocuments, setTotalDocuments] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);
  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );

  // Export functionality
  const [triggerExport, { isFetching: isFetchingExcel }] =
    useLazyExportDocumentsQuery();

  // Data queries
  const { data: customersData = [], isLoading: isLoadingCustomers } =
    useGetCustomersQuery(null);
  const { data: sellersData = [], isLoading: isLoadingSellers } =
    useGetSellersQuery(null);
  const { data: usersData = [], isLoading: isLoadingUsers } =
    useGetUsersQuery(null);
  const users = usersData || [];

  const getSellerLabel = (seller: any) => {
    if (!seller) return t("notFound");
    const user = users.find((u: any) => u.seller_id === seller.id);
    const nameToShow = user?.username || seller.name || seller.id;
    return `${nameToShow} (${seller.id})`;
  };

  // Memoized query parameters
  const queryParams = useMemo(() => {
    const {
      page,
      searchQuery,
      startDate,
      endDate,
      customer_id,
      sortQuery,
      typeFilter,
      sellerFilter,
    } = filters;

    return {
      page,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      startDate: startDate ? startDate.toISOString().slice(0, 10) : undefined,
      endDate: endDate ? endDate.toISOString().slice(0, 10) : undefined,
      customer_id: selectedClientId || customer_id || undefined,
      sort: sortQuery || undefined,
      type: typeFilter || undefined,
      seller_id: isVendedor ? userData?.seller_id : sellerFilter || undefined,
    };
  }, [
    filters, // 👈 alcanza con filters entero
    selectedClientId,
    isVendedor,
    userData?.seller_id,
  ]);

  // Main documents query
  const { refetch, isLoading, error } = useGetDocumentsPagQuery(queryParams, {
    skip: false,
  });

  // Separate state for search input to avoid conflicts
  const [searchInput, setSearchInput] = useState("");

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setFilters((prev) => ({ ...prev, searchQuery: query, page: 1 }));
        setItems([]);
      }, DEBOUNCE_DELAY),
    []
  );

  // Filter update helper
  const updateFilter = useCallback(
    (key: keyof DocumentFilters, value: any, resetPage = true) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        ...(resetPage && { page: 1 }),
      }));
      if (resetPage) {
        setItems([]);
      }
    },
    []
  );

  // Auto-set filters based on context
  useEffect(() => {
    if (selectedClientId && selectedClientId !== filters.customer_id) {
      updateFilter("customer_id", selectedClientId);
    }
  }, [selectedClientId, filters.customer_id, updateFilter]);

  useEffect(() => {
    if (
      isVendedor &&
      userData?.seller_id &&
      userData.seller_id !== filters.sellerFilter
    ) {
      updateFilter("sellerFilter", userData.seller_id);
    }
  }, [isVendedor, userData?.seller_id, filters.sellerFilter, updateFilter]);

  // Load documents effect
  useEffect(() => {
    const loadDocuments = async () => {
      setIsFetching(true);
      try {
        const result = await refetch().unwrap();
        const response = result || { documents: [], total: 0 };
        const newDocs = Array.isArray(response.documents)
          ? response.documents
          : [];

        setTotalDocuments(response.total || 0);
        setItems((prev) =>
          filters.page === 1 ? newDocs : [...prev, ...newDocs]
        );
      } catch (err) {
        console.error(t("errorLoadingDocuments"), err);
        if (filters.page === 1) {
          setItems([]);
          setTotalDocuments(0);
        }
      } finally {
        setIsFetching(false);
      }
    };

    loadDocuments();
    // Podés depender de queryParams para simplificar
  }, [refetch, t, queryParams, filters.page]);

  // Infinite scroll observer
  const observerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const hasMore = items.length < totalDocuments && items.length > 0;

        if (entry.isIntersecting && !isFetching && !isLoading && hasMore) {
          setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
        }
      },
      { threshold: 0.5, rootMargin: "50px" }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [isFetching, isLoading, items.length, totalDocuments]);
  const isCustomer = userRole === "CUSTOMER";

  // Event handlers
  const handleDownload = useCallback(async () => {
    try {
      const blob = await triggerExport({
        query: filters.searchQuery || undefined,
        startDate: filters.startDate
          ? filters.startDate.toISOString().slice(0, 10)
          : undefined,
        endDate: filters.endDate
          ? filters.endDate.toISOString().slice(0, 10)
          : undefined,
        customer_id: selectedClientId || filters.customer_id || undefined, // 👈 snake_case
        sort: filters.sortQuery || undefined,
        type: filters.typeFilter || undefined,
        seller_id: isVendedor
          ? userData?.seller_id
          : filters.sellerFilter || undefined, // 👈 snake_case
      }).unwrap();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documentos_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert(t("downloadError") || "No se pudo descargar el Excel.");
    }
  }, [
    filters,
    selectedClientId,
    isVendedor,
    userData?.seller_id,
    triggerExport,
    t,
  ]);

  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = filters.sortQuery.split(":");
      const newDirection =
        currentField === field && currentDirection === "asc" ? "desc" : "asc";
      updateFilter("sortQuery", `${field}:${newDirection}`);
    },
    [filters.sortQuery, updateFilter]
  );

  const handleResetSearch = useCallback(() => {
    setSearchInput("");
    setFilters((prev) => ({ ...prev, searchQuery: "", page: 1 }));
    setItems([]);
  }, []);

  const handleResetDate = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      startDate: null,
      endDate: null,
      page: 1,
    }));
    setItems([]);
  }, []);

  // Modal handlers
  const openDocumentModal = useCallback((id: string) => {
    setSelectedDocumentId(id);
    setDocumentModalOpen(true);
  }, []);

  const closeDocumentModal = useCallback(() => {
    setDocumentModalOpen(false);
    setSelectedDocumentId(null);
  }, []);

  // Memoized table data
  const tableData = useMemo(() => {
    if (!items.length) return [];

    return items.map((doc) => {
      const customer = customersData.find((c) => c.id === doc.customer_id);
      const seller = sellersData.find((s) => s.id === doc.seller_id);

      return {
        key: doc.id,
        info: (
          <div className="flex justify-center items-center">
            <IoInformationCircleOutline
              className="text-xl cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => openDocumentModal(doc.id)}
              title={t("viewDetails") || "Ver detalles"}
            />
          </div>
        ),
        customer: customer
          ? `${customer.id} - ${customer.name}`
          : t("notFound"),
        type: doc.type,
        number: doc.number,
        date: doc.date,
        amount: formatCurrency(Number(doc.amount)),
        balance: formatCurrency(Number(doc.amount)),
        expiration: doc.expiration_date,
        logistic: doc.expiration_status,
        seller: seller?.name || t("notFound"),
      };
    });
  }, [items, customersData, sellersData, openDocumentModal, t]);

  // Memoized filter components
  const filterComponents = useMemo(
    () => ({
      typeFilter: (
        <select
          value={filters.typeFilter}
          onChange={(e) => updateFilter("typeFilter", e.target.value)}
          className="border border-gray-300 rounded p-2 min-w-[150px]"
        >
          <option value="">{t("allTypes")}</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      ),
      sellerFilter: (
        <select
          value={
            isVendedor
              ? userData?.seller_id || ""
              : isCustomer
              ? ""
              : filters.sellerFilter
          }
          onChange={(e) => {
            if (isVendedor || isCustomer) return;
            updateFilter("sellerFilter", e.target.value);
          }}
          className="border border-gray-300 rounded p-2 min-w-[150px]"
          disabled={
            isVendedor || isCustomer || isLoadingSellers || isLoadingUsers
          }
        >
          <option value="">{t("allSellers")}</option>
          {sellersData.map((s) => (
            <option key={s.id} value={s.id}>
              {getSellerLabel(s)}
            </option>
          ))}
        </select>
      ),

      customerFilter: (
        <select
          value={selectedClientId || filters.customer_id}
          onChange={(e) => updateFilter("customer_id", e.target.value)}
          className="border border-gray-300 rounded p-2 min-w-[150px]"
          disabled={Boolean(selectedClientId) || isLoadingCustomers}
        >
          <option value="">{t("allCustomers")}</option>
          {customersData.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ),
    }),
    [
      filters,
      isVendedor,
      userData?.seller_id,
      selectedClientId,
      isLoadingSellers,
      isLoadingCustomers,
      sellersData,
      customersData,
      updateFilter,
      t,
    ]
  );

  // Header configuration
  const headerBody = useMemo(
    () => ({
      buttons: [
        // {
        //   logo: <AiOutlineDownload />,
        //   title: isFetchingExcel ? t("downloading") : t("download"),
        //   onClick: handleDownload,
        //   disabled: isFetchingExcel || items.length === 0,
        // },
      ],
      filters: [
        {
          content: (
            <div className="relative">
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  setSearchInput(value);
                  debouncedSearch(value);
                }}
                onKeyDown={(e: any) => {
                  if (e.key === "Enter") {
                    setFilters((prev) => ({
                      ...prev,
                      searchQuery: searchInput,
                      page: 1,
                    }));
                    setItems([]);
                  }
                }}
              />
              {searchInput && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded-full p-1"
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
                selected={filters.startDate}
                onChange={(date) => updateFilter("startDate", date)}
                placeholderText={t("dateFrom")}
                dateFormat="yyyy-MM-dd"
                className="border border-gray-300 rounded p-2"
                maxDate={filters.endDate || new Date()}
                disabled={isFetching}
              />
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => updateFilter("endDate", date)}
                placeholderText={t("dateTo")}
                dateFormat="yyyy-MM-dd"
                className="border border-gray-300 rounded p-2"
                minDate={filters.startDate || undefined}
                maxDate={new Date()}
                disabled={isFetching}
              />
              {(filters.startDate || filters.endDate) && (
                <button
                  onClick={handleResetDate}
                  className="px-2 py-1 text-gray-500 hover:text-gray-700"
                  disabled={isFetching}
                >
                  <FaTimes />
                </button>
              )}
            </div>
          ),
        },
        { content: filterComponents.typeFilter },
        { content: filterComponents.sellerFilter },
        { content: filterComponents.customerFilter },
      ],
      results:
        searchInput || filters.searchQuery
          ? t("results", { count: items.length })
          : t("results", { count: totalDocuments }),
    }),
    [
      isFetchingExcel,
      handleDownload,
      items.length,
      filters,
      debouncedSearch,
      updateFilter,
      handleResetSearch,
      handleResetDate,
      filterComponents,
      totalDocuments,
      isFetching,
      t,
    ]
  );

  // Loading state
  if (isLoading && filters.page === 1 && items.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <span className="ml-2">{t("loading") || "Cargando..."}</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded border">
        <p>{t("errorLoadingDocuments")}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          {t("retry") || "Reintentar"}
        </button>
      </div>
    );
  }
  function formatCurrency(value: number) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    })
      .format(value)
      .replace("ARS", "");
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
        <h3 className="font-bold p-4">{t("document.comprobante")}</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={[
            {
              component: <IoInformationCircleOutline className="text-xl" />,
              key: "info",
              sortable: false,
            },
            { name: t("customer"), key: "customer", sortable: true },
            { name: t("type"), key: "type", sortable: true },
            {
              name: t("number"),
              key: "number",
              important: true,
              sortable: true,
            },
            { name: t("date"), key: "date", sortable: true },
            { name: t("amount"), key: "amount", sortable: true },
            { name: t("balance"), key: "balance", sortable: true },
            { name: t("expiration"), key: "expiration", sortable: true },
            { name: t("logistic"), key: "logistic", sortable: true },
            { name: t("seller"), key: "seller", sortable: true },
          ]}
          data={tableData}
          onSort={handleSort}
          sortField={filters.sortQuery.split(":")[0]}
          sortOrder={(filters.sortQuery.split(":")[1] as "asc" | "desc") || ""}
        />

        {/* Infinite scroll indicator */}
        {isFetching && filters.page > 1 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            <span className="ml-2 text-gray-600">
              {t("loadingMore") || "Cargando más..."}
            </span>
          </div>
        )}

        {/* End of results indicator */}
        {items.length >= totalDocuments && totalDocuments > 0 && (
          <div className="text-center py-4 text-gray-500">
            {t("allResultsLoaded") || "Todos los resultados han sido cargados"}
          </div>
        )}

        {/* No results message */}
        {!isLoading && items.length === 0 && !isFetching && (
          <div className="text-center py-8 text-gray-500">
            {t("noDocumentsFound") || "No se encontraron documentos"}
          </div>
        )}

        <div ref={observerRef} className="h-10" />
        {/* No results message */}
        {!isLoading && items.length === 0 && !isFetching && (
          <div className="text-center py-8 text-gray-500">
            {t("noDocumentsFound") || "No se encontraron documentos"}
          </div>
        )}

        {/* Modal de detalle */}
        {isDocumentModalOpen && selectedDocumentId && (
          <DocumentDetailsModal
            documentId={selectedDocumentId}
            onClose={closeDocumentModal}
            customers={customersData}
            sellers={sellersData}
          />
        )}

        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default VouchersComponent;
