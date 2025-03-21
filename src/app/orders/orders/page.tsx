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
  const userRole = userData?.role ? userData.role.toUpperCase() : "";
  // Estados básicos
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // Para búsqueda en la tabla
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [customer_id, setCustomer_id] = useState("");
  const [seller_id, setSeller_id] = useState(""); // Filtro por seller_id
  const [searchFilter, setSearchFilter] = useState(""); // Filtro para búsqueda en el backend
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"
  const [statusFilter, setStatusFilter] = useState(""); // Filtro para status
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [sellerFilter, setSellerFilter] = useState("");

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { selectedClientId } = useClient();

  // Referencias para el Intersection Observer
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Función para formatear la fecha en "yyyy-MM-dd"
  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
    }
  }, [selectedClientId]);


  // Usamos useMemo para agrupar los parámetros de la query.
  const queryParams = useMemo(() => {
    return {
      page,
      limit: ITEMS_PER_PAGE,
      startDate: startDate ? formatDate(startDate) : undefined,
      endDate: endDate ? formatDate(endDate) : undefined,
      customer_id,
      seller_id: sellerFilter,
      sort: sortQuery,
      status: statusFilter || undefined,
      search: searchFilter || undefined,
    };
  }, [
    page,
    startDate,
    endDate,
    customer_id,
    seller_id,
    sortQuery,
    statusFilter,
    searchFilter,
  ]);

  // Query para obtener órdenes paginadas
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetOrdersPagQuery(queryParams, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Actualizar customer_id cuando cambie selectedClientId
  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch();
    } else {
      setCustomer_id("");
      refetch();
    }
  }, [selectedClientId]);

  // ======================================================
  // Efecto para Actualizar la Lista y Evitar Duplicados
  // ======================================================
  useEffect(() => {
    if (data?.orders) {
      setItems((prev) => {
        if (page === 1) {
          return data.orders;
        }
        const newItems = data.orders.filter(
          (order) => !prev.some((item) => item._id === order._id)
        );
        return [...prev, ...newItems];
      });
      setHasMore(data.orders.length === ITEMS_PER_PAGE);
    }
  }, [data?.orders, page]);

  // ======================================================
  // Infinite Scroll (Intersection Observer)
  // ======================================================
  const lastArticleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isQueryLoading) {
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.0, rootMargin: "200px" }
      );

      if (node) observerRef.current.observe(node);
    },
    [hasMore, isQueryLoading]
  );

  // Reiniciar fechas y paginación
  const handleResetDate = () => {
    setEndDate(null);
    setStartDate(null);
    setItems([]);
    setPage(1);
    setHasMore(true);
    // Opcionalmente, llamar a refetch() aquí
    refetch();
  };

  // Manejo de ordenamiento
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
      setHasMore(true);
      // Con cambio de queryParams (por dependencia) se reejecuta la consulta
    },
    [sortQuery]
  );

  function formatPriceWithCurrency(price: number): string {
    const formattedNumber = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(price)
      .replace("ARS", "")
      .trim();
    return `${formattedNumber}`;
  }

  const openDetailModal = (order: any) => {
    setCurrentOrder(order);
    setIsDetailOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setCurrentOrder(null);
  };

  useEffect(() => {
    if (userRole === "VENDEDOR" && userData?.seller_id) {
      setSellerFilter(userData.seller_id);
    }
  }, [userRole, userData]);

  // Construcción de datos para la tabla
  const tableData = items
    ?.filter((order) => {
      // Si se filtró por customer_id en el backend, este filtro es opcional
      return !customer_id || order.customer.id === customer_id;
    })
    ?.map((order) => {
      const customer = customersData?.find(
        (data) => data.id === order.customer.id
      );
      const seller = sellersData?.find((data) => data.id === order.seller?.id);
      return {
        key: order._id, // Se asume que el modelo usa "id" en lugar de "_id"
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
        status: order.status,
      };
    });

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
    { name: t("status"), key: "status" },
  ];

  // Header con filtros adicionales para fechas, status, seller_id y búsqueda
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
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              placeholderText={t("dateFrom")}
              dateFormat="yyyy-MM-dd"
              className="border border-gray-300 rounded p-2"
            />
            {startDate && (
              <button onClick={handleResetDate} aria-label={t("clearDate")}>
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
      {
        content: (
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText={t("dateTo")}
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      {
        content: (
          <select
            className="border border-gray-300 rounded p-2"
            defaultValue=""
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
          >
            <option value="" disabled>
              {t("selectStatus")}
            </option>
            <option value="charged">{t("charged")}</option>
            <option value="sendend">{t("sendend")}</option>
          </select>
        ),
      },
      {
        // Filtro para vendedor. Si el rol es VENDEDOR, se usa el seller del usuario y se deshabilita el select.
        content: (
          <select
            value={userRole === "VENDEDOR" ? userData?.seller_id : sellerFilter}
            onChange={(e) => {
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
            {sellersData &&
              sellersData.map((seller: any) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
          </select>
        ),
      },
      {
        content: (
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => {
              setSearchFilter(e.target.value);
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
            placeholder={t("searchFilter")}
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
    ],
    results: `${t("results", { count: data?.total || 0 })}`,
  };

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
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0]}
          sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
        />
        <div ref={lastArticleRef} className="h-10" />
      </div>

      <Modal isOpen={isDetailOpen} onClose={closeDetailModal}>
        <OrderDetail order={currentOrder} closeModal={closeDetailModal} />
      </Modal>
    </PrivateRoute>
  );
};

export default Page;
