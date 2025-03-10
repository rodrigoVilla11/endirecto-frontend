"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [customer_id, setCustomer_id] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"
  const [statusFilter, setStatusFilter] = useState(""); // Nuevo estado para status
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { selectedClientId } = useClient();

  // Referencias para el Intersection Observer
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Función para formatear la fecha en "yyyy-MM-dd"
  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Redux query para obtener órdenes paginadas, ahora incluyendo el filtro de status
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetOrdersPagQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      startDate: startDate ? formatDate(startDate) : undefined,
      endDate: endDate ? formatDate(endDate) : undefined,
      customer_id,
      sort: sortQuery,
      status: statusFilter || undefined,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Actualizar customer_id y refetch cuando cambie selectedClientId
  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch();
    } else {
      setCustomer_id("");
      refetch();
    }
  }, [selectedClientId]);

  // Efecto para cargar órdenes (documentos) y manejar la paginación
  useEffect(() => {
    const loadDocuments = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          // Verificamos si la respuesta es un array o un objeto con la propiedad 'orders'
          const newDocuments = Array.isArray(result)
            ? result
            : result.orders || [];
          if (page === 1) {
            setItems(newDocuments);
          } else {
            setItems((prev) => [...prev, ...newDocuments]);
          }
          setHasMore(newDocuments.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading documents:", error);
        } finally {
          setIsLoading(false);
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
    statusFilter,
  ]);

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

  // Reiniciar las fechas y reiniciar la paginación
  const handleResetDate = () => {
    setEndDate(null);
    setStartDate(null);
    setItems([]);
    setPage(1);
    setHasMore(true);
  };

  // Manejo de ordenamiento
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSortQuery = "";
      if (currentField === field) {
        // Alterna entre ascendente y descendente
        newSortQuery =
          currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
        // Nuevo campo de ordenamiento, por defecto ascendente
        newSortQuery = `${field}:asc`;
      }
      setSortQuery(newSortQuery);
      setPage(1);
      setItems([]);
      setHasMore(true);
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

  // Construcción de datos para la tabla
  const tableData = items
    ?.filter((order) => {
      // Si se filtró por customer_id en el backend, este filtro es opcional
      return !customer_id || order.customer.id === customer_id;
    })
    ?.map((order) => {
      const customer = customersData?.find(
        (data) => data.id == order.customer.id
      );
      const seller = sellersData?.find((data) => data.id == order.seller?.id);
      return {
        key: order.id, // Se asume que el nuevo modelo usa "id" en lugar de "_id"
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
        number: order.multisoft_id, // Si usas camelCase, quizá "multisoftId"
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

  // Handler para el cambio de status en el select
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

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
          <div>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              placeholderText={t("dateFrom")}
              dateFormat="yyyy-MM-dd"
              className="border border-gray-300 rounded p-2"
            />
            {startDate && (
              <button
                className="-translate-y-1/2"
                onClick={handleResetDate}
                aria-label={t("clearDate")}
              >
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
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="" disabled>
              {t("selectStatus")}
            </option>
            <option value="charged">{t("charged")}</option>
            <option value="sendend">{t("sendend")}</option>
          </select>
        ),
      },
    ],
    results: `${data?.total || 0} ${t("results")}`,
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
        <div ref={observerRef} className="h-10" />
      </div>

      <Modal isOpen={isDetailOpen} onClose={closeDetailModal}>
        <OrderDetail
          order={currentOrder}
          closeModal={closeDetailModal}
        />
      </Modal>
    </PrivateRoute>
  );
};

export default Page;
