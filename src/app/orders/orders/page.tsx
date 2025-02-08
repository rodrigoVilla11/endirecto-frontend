"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { FaRegFilePdf } from "react-icons/fa6";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useClient } from "@/app/context/ClientContext";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetOrdersPagQuery } from "@/redux/services/ordersApi";
import DatePicker from "react-datepicker";
import { FaTimes } from "react-icons/fa";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 15;

const Page = () => {
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

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { selectedClientId } = useClient();

  // Referencias para el Intersection Observer
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Función para formatear la fecha en "yyyy-MM-dd"
  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Redux query para obtener órdenes paginadas
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
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  console.log(data);
  console.log(error);
  console.log(isQueryLoading);

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
  // Efecto para cargar órdenes y manejar la paginación
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
  }, [page, searchQuery, startDate, endDate, customer_id, sortQuery]);

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
      const seller = sellersData?.find((data) => data.id == order.seller.id);

      return {
        key: order.id, // Se asume que el nuevo modelo usa "id" en lugar de "_id"
        info: (
          <div className="flex justify-center items-center">
            <IoInformationCircleOutline className="text-center text-xl" />
          </div>
        ),
        seller: seller?.name || "NOT FOUND",
        customer: customer ? `${customer.id} - ${customer.name}` : "NOT FOUND",
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
    { name: "Seller", key: "seller" },
    { name: "Customer", key: "customer" },
    { name: "Number", key: "number" },
    { name: "Date", key: "date" },
    { name: "Total Without Taxes", key: "total-without-taxes" },
    { name: "Status", key: "status" },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
    ],
    filters: [
      {
        content: (
          <div>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              placeholderText="Date From"
              dateFormat="yyyy-MM-dd"
              className="border border-gray-300 rounded p-2"
            />
            {startDate && (
              <button
                className="-translate-y-1/2"
                onClick={handleResetDate}
                aria-label="Clear date"
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
            placeholderText="Date To"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      {
        content: (
          <select>
            <option value="status" disabled>
              STATUS
            </option>
            <option value="status" disabled>
              CHARGED
            </option>
            <option value="status" disabled>
              SENDEND
            </option>
          </select>
        ),
      },
    ],
    results: `${data?.total || 0} Results`,
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
        <h3 className="font-bold p-4">ORDERS</h3>
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
    </PrivateRoute>
  );
};

export default Page;
