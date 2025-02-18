"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { IoMdPin } from "react-icons/io";
import ButtonOnOff from "../components/components/ButtonOnOff";
import {
  ActionType,
  StatusType,
  useCountCrmQuery,
  useGetCrmPagQuery,
  useUpdateCrmMutation,
} from "@/redux/services/crmApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetCollectionsQuery } from "@/redux/services/collectionsApi";
import PrivateRoute from "../context/PrivateRoutes";
import DatePicker from "react-datepicker";
import { FaPlus, FaTimes } from "react-icons/fa";
import Modal from "../components/components/Modal";
import CreateCRMComponent from "./CreateCRM";
import { useClient } from "../context/ClientContext";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [customer_id, setCustomer_id] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"
  const { selectedClientId } = useClient();

  // Nuevo estado para el modal de creación
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  // Referencia para el IntersectionObserver
  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data: collectionData } = useGetCollectionsQuery(null);
  // Query para CRM que retorna { crms, total }
  const { data, error, isLoading: isQueryLoading, refetch } = useGetCrmPagQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      type: "", // Si deseas filtrar por tipo, asigna aquí
      status: "", // Si deseas filtrar por status, asigna aquí
      insitu: "", // Si corresponde
      customer_id,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const [updateCrm] = useUpdateCrmMutation();

  // Actualiza customer_id al cambiar selectedClientId
  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch();
    } else {
      setCustomer_id("");
      refetch();
    }
  }, [selectedClientId, refetch, isLoading, t]);

  // Efecto para cargar documentos (CRM) y manejar la paginación
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
  }, [page, startDate, endDate, customer_id, sortQuery, refetch, isLoading, t]);

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
    if (currentObserver) observer.observe(currentObserver);

    return () => {
      if (currentObserver) observer.unobserve(currentObserver);
    };
  }, [hasMore, isLoading]);

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

  // Mapeo de datos para la tabla
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

  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: t("new"), onClick: openCreateModal },
      { logo: <IoMdPin />, title: t("viewOnMap") },
    ],
    filters: [
      {
        content: (
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText={t("dateFrom")}
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
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
      <div ref={observerRef} className="h-10" />
    </PrivateRoute>
  );
};

export default Page;
