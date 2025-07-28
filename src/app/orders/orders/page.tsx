"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import { FaInfoCircle, FaTimes } from "react-icons/fa";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetOrdersPagQuery } from "@/redux/services/ordersApi";
import { useClient } from "@/app/context/ClientContext";
import Modal from "@/app/components/components/Modal";
import OrderDetail from "./OrderDetail";
import { useAuth } from "@/app/context/AuthContext";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const { selectedClientId } = useClient();

  const userRole = userData?.role ? userData.role.toUpperCase() : "";

  // Estados principales
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Estados de filtros
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    customer_id: "",
    seller_id: "",
    status: "",
    search: "",
  });

  // Estados para debounce
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Estados de UI
  const [sortQuery, setSortQuery] = useState<string>("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  // Queries
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);

  // Formatear fecha para la API
  const formatDate = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Reset de paginación
  const resetPagination = useCallback(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    setIsLoadingMore(false);
  }, []);

  // Configurar filtros iniciales basados en el rol del usuario
  useEffect(() => {
    const initialFilters = {
      ...filters,
      customer_id: selectedClientId || "",
    };

    // Si es vendedor, establecer su seller_id automáticamente
    if (userRole === "VENDEDOR" && userData?.seller_id) {
      initialFilters.seller_id = userData.seller_id;
    }

    setFilters(initialFilters);
  }, [selectedClientId, userRole, userData?.seller_id]);

  // Debounce para búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (debouncedSearch !== filters.search) {
        setDebouncedSearch(filters.search);
        resetPagination();
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.search, resetPagination]);

  // Parámetros para la query
  const queryParams = useMemo(() => {
    return {
      page,
      limit: ITEMS_PER_PAGE,
      startDate: filters.startDate ? formatDate(filters.startDate) : undefined,
      endDate: filters.endDate ? formatDate(filters.endDate) : undefined,
      customer_id: filters.customer_id || undefined,
      seller_id: filters.seller_id || undefined,
      sort: sortQuery || undefined,
      status: filters.status || undefined,
      search: debouncedSearch || undefined,
    };
  }, [page, filters, sortQuery, debouncedSearch, formatDate]);

  // Query principal
  const {
    data,
    error,
    isLoading: isQueryLoading,
    isFetching,
    refetch,
  } = useGetOrdersPagQuery(queryParams, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false,
    refetchOnReconnect: true,
    skip: false,
  });

  console.log("data", data);

  // Manejar datos de la API
  useEffect(() => {
    if (data?.orders) {
      setItems((prev) => {
        if (page === 1) {
          // Primera página - reemplazar todos los items
          return data.orders;
        } else {
          // Páginas siguientes - agregar solo items nuevos
          const existingIds = new Set(prev.map((item) => item._id));
          const newItems = data.orders.filter(
            (order) => !existingIds.has(order._id)
          );
          return [...prev, ...newItems];
        }
      });

      // Determinar si hay más páginas
      const receivedItems = data.orders.length;
      setHasMore(receivedItems === ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }
  }, [data?.orders, page]);

  // Efecto para resetear cuando cambian los filtros
  useEffect(() => {
    if (page === 1) {
      setItems([]);
      setHasMore(true);
      setIsLoadingMore(false);
    }
  }, [
    queryParams.startDate,
    queryParams.endDate,
    queryParams.customer_id,
    queryParams.seller_id,
    queryParams.status,
    queryParams.search,
    queryParams.sort,
  ]);

  // Actualizar filtro genérico
  const updateFilter = useCallback(
    (key: string, value: any) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
      resetPagination();
    },
    [resetPagination]
  );

  // Configurar intersection observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          hasMore &&
          !isQueryLoading &&
          !isFetching &&
          !isLoadingMore
        ) {
          console.log("Loading more items...");
          setIsLoadingMore(true);
          setPage((prev) => prev + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isQueryLoading, isFetching, isLoadingMore]);

  // Observar el último elemento
  useEffect(() => {
    if (lastElementRef.current && observerRef.current) {
      observerRef.current.observe(lastElementRef.current);
    }

    return () => {
      if (lastElementRef.current && observerRef.current) {
        observerRef.current.unobserve(lastElementRef.current);
      }
    };
  }, [items.length]);

  // Handlers
  const handleResetDates = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      startDate: null,
      endDate: null,
    }));
    resetPagination();
  }, [resetPagination]);

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
      resetPagination();
    },
    [sortQuery, resetPagination]
  );

  // Formatear precio
  const formatPriceWithCurrency = useCallback((price: number): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(price)
      .replace("ARS", "")
      .trim();
  }, []);

  // Modal handlers
  const openDetailModal = useCallback((order: any) => {
    setCurrentOrder(order);
    setIsDetailOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailOpen(false);
    setCurrentOrder(null);
  }, []);

  // Datos de la tabla
  const tableData = useMemo(() => {
    return (
      items?.map((order) => {
        const customer = customersData?.find(
          (data) => data.id === order.customer.id
        );
        const seller = sellersData?.find(
          (data) => data.id === order.seller?.id
        );

        return {
          key: `${customer?.name}-${format(
            new Date(order.date),
            "dd/MM/yyyy"
          )}-${order._id}`,

          info: (
            <div className="flex justify-center items-center">
              <FaInfoCircle
                className="text-center text-xl hover:cursor-pointer hover:text-blue-500 text-green-500"
                onClick={() => openDetailModal(order)}
              />
            </div>
          ),
          seller: seller?.name || t("notFound"),
          customer: customer
            ? `${customer.id} - ${customer.name}`
            : t("notFound"),
          number: order.multisoft_id,
          date: order.date
            ? format(new Date(order.date), "dd/MM/yyyy HH:mm")
            : "N/A",
          "total-without-taxes": formatPriceWithCurrency(order.total),
          observations: order.notes ? order.notes : "-",
          status: order.status,
        };
      }) || []
    );
  }, [
    items,
    customersData,
    sellersData,
    t,
    openDetailModal,
    formatPriceWithCurrency,
  ]);

  // Headers de la tabla
  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: t("seller"), key: "seller", important: true },
    { name: t("customer"), key: "customer", important: true },
    { name: t("number"), key: "number" },
    { name: t("date"), key: "date" },
    {
      name: t("totalWithoutTaxes"),
      key: "total-without-taxes",
      important: true,
    },
    { name: t("observations.label"), key: "observations" },
    { name: t("status"), key: "status" },
  ];

  // Header body
  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload />,
        title: t("download"),
      },
    ],
    filters: [
      {
        content: (
          <div className="flex items-center gap-2">
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => updateFilter("startDate", date)}
              placeholderText={t("dateFrom")}
              dateFormat="yyyy-MM-dd"
              className="border border-gray-300 rounded p-2"
              maxDate={filters.endDate || undefined}
            />
            {(filters.startDate || filters.endDate) && (
              <button
                onClick={handleResetDates}
                aria-label={t("clearDate")}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
        ),
      },
      {
        content: (
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => updateFilter("endDate", date)}
            placeholderText={t("dateTo")}
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
            minDate={filters.startDate || undefined}
          />
        ),
      },
      {
        content: (
          <select
            className="border border-gray-300 rounded p-2"
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="">{t("allStatuses") || "Todos los estados"}</option>
            <option value="charged">{t("charged")}</option>
            <option value="sendend">{t("sendend")}</option>
          </select>
        ),
      },
      {
        content: (
          <select
            value={filters.seller_id}
            onChange={(e) => updateFilter("seller_id", e.target.value)}
            className="border border-gray-300 rounded p-2"
            disabled={userRole === "VENDEDOR"}
          >
            <option value="">{t("allSellers")}</option>
            {sellersData?.map((seller: any) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>
        ),
      },
      {
        content: (
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder={t("searchFilter")}
              className="border border-gray-300 rounded p-2 pr-8"
            />
            {filters.search && (
              <button
                onClick={() => updateFilter("search", "")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: `${t("results", { count: data?.total || 0 })}`,
  };

  // Loading y error states
  if (error) {
    return (
      <div className="p-4 text-red-500">
        {t("errorLoadingOrders") || "Error al cargar pedidos"}
      </div>
    );
  }

  const isInitialLoading = isQueryLoading && page === 1 && items.length === 0;

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
        <h3 className="font-bold p-4">{t("orders")}</h3>
        <Header headerBody={headerBody} />

        {isInitialLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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

            {/* Loading indicator para infinite scroll */}
            {(isLoadingMore || isFetching) && items.length > 0 && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                <span className="ml-2 text-gray-600">Cargando más...</span>
              </div>
            )}

            {/* Sentinel para infinite scroll */}
            {hasMore && !isInitialLoading && (
              <div
                ref={lastElementRef}
                className="h-20 flex items-center justify-center"
              >
                {/* Elemento invisible para triggear el scroll infinito */}
              </div>
            )}

            {/* Mensaje cuando no hay más elementos */}
            {!hasMore && items.length > 0 && (
              <div className="text-center py-4 text-gray-500">
                No hay más elementos para cargar
              </div>
            )}

            {/* Mensaje cuando no hay resultados */}
            {!isInitialLoading && items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron resultados
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={isDetailOpen} onClose={closeDetailModal}>
        <OrderDetail order={currentOrder} closeModal={closeDetailModal} />
      </Modal>
    </PrivateRoute>
  );
};

export default Page;
