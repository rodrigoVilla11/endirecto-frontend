"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { IoMdPin } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import {
  useGetCrmPagQuery,
  useUpdateCrmMutation,
  ActionType,
  StatusType,
} from "@/redux/services/crmApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetCollectionsQuery } from "@/redux/services/collectionsApi";
import PrivateRoute from "../context/PrivateRoutes";
import Modal from "../components/components/Modal";
import CreateCRMComponent from "./CreateCRM";
import { useClient } from "../context/ClientContext";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // ---------- Estados para la paginación y datos ----------
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // ---------- Estados para los filtros ----------
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sellerFilter, setSellerFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState(""); // Ej. “Estadístico de pedidos”
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  // ---------- Estados y lógica para modal de creación ----------
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  // ---------- Context y data adicional ----------
  const { selectedClientId } = useClient();
  const [customer_id, setCustomer_id] = useState("");
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data: collectionData } = useGetCollectionsQuery(null);

  // ---------- Query principal para CRM ----------
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetCrmPagQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      type: typeFilter,
      status: statusFilter,
      insitu: "", // Ajusta si tu backend lo usa
      customer_id,
      seller_id: sellerFilter,
      user_id: userFilter,
      action: actionFilter, // Si tu backend maneja este campo para “Estadísticas de pedidos”
      search: searchQuery,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const [updateCrm] = useUpdateCrmMutation();

  // ---------- Actualiza el customer_id al cambiar selectedClientId ----------
  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch();
    } else {
      setCustomer_id("");
      refetch();
    }
  }, [selectedClientId, refetch, isLoading, t]);

  // ---------- Manejo de la carga inicial y paginación ----------
  useEffect(() => {
    const loadDocuments = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newDocuments = result.crms || [];
          setItems((prev) => (page === 1 ? newDocuments : [...prev, ...newDocuments]));
          setHasMore(newDocuments.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error(t("errorLoadingDocuments"), error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadDocuments();
  }, [
    page,
    startDate,
    endDate,
    sellerFilter,
    userFilter,
    statusFilter,
    typeFilter,
    actionFilter,
    searchQuery,
    sortQuery,
    refetch,
    isLoading,
    t,
  ]);

  // ---------- IntersectionObserver para scroll infinito ----------
  const observerRef = useRef<HTMLDivElement | null>(null);
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
    if (currentObserver) observer.observe(currentObserver);

    return () => {
      if (currentObserver) observer.unobserve(currentObserver);
    };
  }, [hasMore, isLoading]);

  // ---------- Manejo de ordenamiento ----------
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery ? sortQuery.split(":") : ["", ""];
      let newSortQuery = "";
      if (currentField === field) {
        newSortQuery = currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
        newSortQuery = `${field}:asc`;
      }
      setSortQuery(newSortQuery);
      setPage(1);
      setItems([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  // ---------- Mapeo de datos para la tabla ----------
  const tableData = items?.map((crm) => {
    const customer = customersData?.find((data) => data.id === crm.customer_id);
    const seller = sellersData?.find((data) => data.id === crm.seller_id);
    const collection = collectionData?.find((data) => data._id === crm.seller_id);

    return {
      key: crm._id,
      info: (
        <div className="flex justify-center items-center">
          <IoInformationCircleOutline className="text-center text-xl" />
        </div>
      ),
      seller: seller?.name,
      customer: customer?.name,
      user: crm.user_id,
      date: crm.date ? format(new Date(crm.date), "yyyy-MM-dd") : "N/A",
      type: crm.type,
      number: crm.number,
      amount: collection?.amount,
      notes: crm.notes,
      status: crm.status,
      gps: crm.gps,
    };
  });

  // ---------- Definición de columnas ----------
  const tableHeader = [
    { component: <IoInformationCircleOutline className="text-center text-xl" />, key: "info" },
    { name: t("seller"), key: "seller", important: true },
    { name: t("customer"), key: "customer", important: true },
    { name: t("user"), key: "user" },
    { name: t("date"), key: "date" },
    { name: t("type"), key: "type", important: true },
    { name: t("number"), key: "number", important: true },
    { name: t("amount"), key: "amount" },
    { name: t("notes"), key: "notes" },
    { name: t("status"), key: "status" },
    { name: t("gps"), key: "gps" },
  ];

  // ---------- Filtros en la cabecera (Header) ----------
  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: t("new"), onClick: openCreateModal },
      { logo: <IoMdPin />, title: t("viewOnMap") },
    ],
    filters: [
      // Fecha desde
      {
        content: (
          <DatePicker
            selected={startDate}
            onChange={(date) => {
              setStartDate(date);
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
            placeholderText={t("dateFrom")}
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      // Fecha hasta
      {
        content: (
          <DatePicker
            selected={endDate}
            onChange={(date) => {
              setEndDate(date);
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
            placeholderText={t("dateTo")}
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      // Filtro por Vendedor
      {
        content: (
          <select
            value={sellerFilter}
            onChange={(e) => {
              setSellerFilter(e.target.value);
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
            className="border border-gray-300 rounded p-2"
          >
            <option value="">{t("seller")}</option>
            {sellersData?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ),
      },
      // Filtro por Usuario
      {
        content: (
          <input
            type="text"
            placeholder={t("user")}
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
            className="border border-gray-300 rounded p-2"
            style={{ width: "100px" }}
          />
        ),
      },
      // Filtro por Estado
      {
        content: (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
            className="border border-gray-300 rounded p-2"
          >
            <option value="">{t("status")}</option>
            <option value="PENDING">PENDING</option>
            <option value="CHARGED">CHARGED</option>
            {/* Agrega más estados si tu backend los maneja */}
          </select>
        ),
      },
      // Filtro por Tipo
      {
        content: (
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
            className="border border-gray-300 rounded p-2"
          >
            <option value="">{t("type")}</option>
            <option value="VISIT">VISIT</option>
            <option value="ORDER">ORDER</option>
            <option value="RECLAIM">RECLAIM</option>
            {/* Agrega más tipos si tu backend los maneja */}
          </select>
        ),
      },
      // Filtro "Estadístico de pedidos" (actionFilter)
      {
        content: (
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
            className="border border-gray-300 rounded p-2"
          >
            <option value="">{t("orderStats")}</option>
            <option value="ORDER_STATS">{t("someOption")}</option>
            {/* Ajusta las opciones según tu backend */}
          </select>
        ),
      },
      // Filtro de búsqueda general
      {
        content: (
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
            className="border border-gray-300 rounded p-2"
            style={{ width: "120px" }}
          />
        ),
      },
    ],
    results: `${data?.total || 0} ${t("results")}`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("crm")}</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0] || ""}
          sortOrder={(sortQuery.split(":")[1] as "asc" | "desc") || ""}
        />
      </div>

      {/* Intersection Observer div */}
      <div ref={observerRef} className="h-10" />

      {/* Modal de creación */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateCRMComponent closeModal={closeCreateModal} />
      </Modal>
    </PrivateRoute>
  );
};

export default Page;
