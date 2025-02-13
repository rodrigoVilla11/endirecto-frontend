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

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [customer_id, setCustomer_id] = useState("");
  const [insitu, setInsitu] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"
  const [contactedStates, setContactedStates] = useState<boolean[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const { selectedClientId } = useClient();

  // Referencias para el Intersection Observer
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
    } else {
      setCustomer_id("");
    }
  }, [selectedClientId]);

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data: collectionData } = useGetCollectionsQuery(null);

  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Query que retorna { crms: Crm[], total: number }
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetCrmPagQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      startDate: startDate ? formatDate(startDate) : undefined,
      endDate: endDate ? formatDate(endDate) : undefined,
      type,
      status,
      insitu,
      customer_id,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const [updateCrm] = useUpdateCrmMutation();
  // Si bien cuentas con countCrmData, ahora usaremos data.total para mostrar el total

  // Actualizar customer_id al cambiar selectedClientId
  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch();
    } else {
      setCustomer_id("");
      refetch();
    }
  }, [selectedClientId]);

  // Efecto para cargar documentos (CRM) y manejar la paginación
  useEffect(() => {
    const loadDocuments = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          // Se espera que refetch().unwrap() retorne un objeto con { crms, total }
          const result = await refetch().unwrap();
          // Extraemos el array de documentos
          const newDocuments = result.crms || [];
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
  }, [page, startDate, endDate, customer_id, sortQuery]);

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

  const handleResetDate = () => {
    setEndDate(null);
    setStartDate(null);
    setItems([]);
    setPage(1);
    setHasMore(true);
  };

  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSortQuery = "";
      if (currentField === field) {
        // Alternar entre ascendente y descendente
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

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = items?.map((crm) => {
    const customer = customersData?.find((data) => data.id === crm.customer_id);
    const seller = sellersData?.find((data) => data.id === crm.seller_id);
    const collection = collectionData?.find(
      (data) => data._id === crm.seller_id
    );

    return {
      key: crm._id, // Se asume que el modelo usa _id o id según corresponda
      info: (
        <div className="flex justify-center items-center">
          <IoInformationCircleOutline className="text-center text-xl" />
        </div>
      ),
      seller: seller?.name,
      customer: customer?.name,
      contacted: "VER BIEN",
      type: crm.type,
      notes: crm.notes,
      date: crm.date ? format(new Date(crm.date), "yyyy-MM-dd") : "N/A",
      collection: collection?.amount,
      order_id: "FALTA AGREGAR",
      amount: collection?.amount,
      status: crm.status,
      gps: crm.gps,
      insitu: crm.insitu.toString(),
    };
  });

  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: "Seller", key: "seller",important: true },
    { name: "Customer", key: "customer",important: true },
    { name: "Contacted", key: "contacted" },
    { name: "Type", key: "type",important: true },
    { name: "Notes", key: "notes",important: true },
    { name: "Date", key: "date" },
    { name: "Payment", key: "payment" },
    { name: "Order", key: "order" },
    { name: "Amount", key: "amount" },
    { name: "Status", key: "status" },
    { name: "GPS", key: "gps" },
    { name: "Insitu", key: "insitu" },
  ];

  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: "New", onClick: openCreateModal },
      {
        logo: <IoMdPin />,
        title: "View On Map",
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
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Status...</option>
            {Object.values(StatusType).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        ),
      },
      {
        content: (
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Type...</option>
            {Object.values(ActionType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        ),
      },
    ],
    // Se usa data.total, que proviene del query, para mostrar el total de resultados
    results: `${data?.total || 0} Results`,
  };

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">CRM</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0]}
          sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
        />
        <div ref={observerRef} className="h-10" />

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateCRMComponent closeModal={closeCreateModal} />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
