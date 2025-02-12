"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useClient } from "@/app/context/ClientContext";
import { FaPlus, FaTimes } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import CRM from "./CRM";
import debounce from "@/app/context/debounce";
import {
  useGetCustomerInformationByCustomerIdQuery,
  useGetLookupDocumentsQuery,
} from "@/redux/services/customersInformations";
import DocumentDetails from "./DocumentDetails";

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
  // sortQuery en el formato "campo:asc" o "campo:desc"
  const [sortQuery, setSortQuery] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { selectedClientId } = useClient();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  // Endpoint para obtener información del cliente (por customer_id)
  const { data: totalDebt } = useGetCustomerInformationByCustomerIdQuery({
    id: selectedClientId ?? undefined,
  });

  // Referencias para el infinite scroll
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Función para formatear fechas (YYYY-MM-DD)
  function formatDate(date: any) {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const handleToggleSelectDocument = (document: any) => {
    // Usamos el campo 'id' o 'key' para identificar el documento
    const exists = selectedDocs.some((doc) => doc.key === document.id);
    if (exists) {
      // Quitar documento
      setSelectedDocs((prev) => prev.filter((doc) => doc.key !== document.id));
    } else {
      // Agregar documento; puedes almacenar solo lo que necesites, por ejemplo, id y amount
      setSelectedDocs((prev) => [
        ...prev,
        { key: document.id, amount: document.amount },
      ]);
    }
  };

  // Extraer sortField y sortOrder de sortQuery
  const [rawSortField, rawSortOrder] = sortQuery
    ? sortQuery.split(":")
    : [undefined, undefined];

  // Validamos que rawSortOrder sea "asc" o "desc"
  const sortField = rawSortField;
  const sortOrder =
    rawSortOrder === "asc" || rawSortOrder === "desc"
      ? rawSortOrder
      : undefined;

  // Endpoint RTK Query: se pasan los parámetros de paginación, filtrado y ordenación
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetLookupDocumentsQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      startDate: startDate ? formatDate(startDate) : undefined,
      endDate: endDate ? formatDate(endDate) : undefined,
      customerId: selectedClientId || "",
      sortField: sortField,
      sortOrder: sortOrder,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Estados para el Modal
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  // Función debounced para búsqueda (si decides implementarla)
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setItems([]);
    setHasMore(true);
  }, 100);

  // Actualiza el customer_id según el selectedClientId y refetch
  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch();
    } else {
      setCustomer_id("");
      refetch();
    }
  }, [selectedClientId]);

  // Efecto para cargar documentos (incluye paginación, orden y filtrado)
  useEffect(() => {
    const loadDocuments = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          // La respuesta tiene la forma: { totalData, data }
          const newDocuments = result?.data || [];

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

  // Intersection Observer para infinite scroll
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

  // Funciones para resetear búsqueda y filtros de fecha
  const handleResetSearch = () => {
    setSearchQuery("");
    setItems([]);
    setPage(1);
    setHasMore(true);
  };

  const handleResetDate = () => {
    setStartDate(null);
    setEndDate(null);
    setItems([]);
    setPage(1);
    setHasMore(true);
  };

  // Función para manejar la ordenación: alterna ascendente/descendente para un campo
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSortQuery = "";

      if (currentField === field) {
        // Alterna entre asc y desc
        newSortQuery =
          currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
        // Nuevo campo de ordenación, por defecto ascendente
        newSortQuery = `${field}:asc`;
      }

      setSortQuery(newSortQuery);
      setPage(1);
      setItems([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  if (isQueryLoading && page === 1) return <p>Loading...</p>;

  const selectedSum = selectedDocs.reduce(
    (acc, doc) => acc + Number(doc.amount),
    0
  );
  const handleOpenDocumentModal = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setDocumentModalOpen(true);
  };

  const closeDocumentModal = () => {
    setDocumentModalOpen(false);
    setSelectedDocumentId(null);
  };

  // Mapea los documentos para la tabla
  const tableData = items
    ?.filter((document) => {
      // Filtra por customer_id localmente (si se desea)
      return !customer_id || document.customer_id === customer_id;
    })
    ?.map((document) => {
      const customer = customersData?.find(
        (data) => data.id === document.customer_id
      );
      const seller = sellersData?.find(
        (data) => data.id === document.seller_id
      );
      const isSelected = selectedDocs.some((doc) => doc.key === document.id);
      return {
        key: document.id,
        action: (
          <ToggleSwitch
            selected={isSelected}
            onToggle={() => handleToggleSelectDocument(document)}
          />
        ),
        id: (
          <div className="flex justify-center items-center">
            <IoInformationCircleOutline className="text-center text-xl"  onClick={() => handleOpenDocumentModal(document.id)}/>
          </div>
        ),
        customer: customer ? `${customer.id} - ${customer.name}` : "NOT FOUND",
        type: document.type,
        number: document.number,
        date: document.date,
        amount: document.amount,
        balance: document.amount,
        expiration: document.expiration_date,
        logistic: document.expiration_status || "",
        seller: seller?.name || "NOT FOUND",
      };
    });

  // Determinar si se recibió el cliente o un resumen
  const isClient = totalDebt && "documents_balance" in totalDebt;
  const isSummary = totalDebt && "total_documents_balance" in totalDebt;

  const rawDocumentsBalance = isClient
    ? parseFloat(totalDebt.documents_balance)
    : isSummary
    ? totalDebt.total_documents_balance
    : 0;

  const rawDocumentsBalanceExpired = isClient
    ? parseFloat(totalDebt.documents_balance_expired)
    : isSummary
    ? totalDebt.total_documents_balance_expired
    : 0;

  // Suma de los valores numéricos
  const finalSumAmount = rawDocumentsBalance + rawDocumentsBalanceExpired;

  // Función para formatear el precio con la moneda (se espera un número)
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

  // Configuración del header
  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
      { logo: <FaPlus />, title: "CRM", onClick: openCreateModal },
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
              <button onClick={handleResetDate} aria-label="Clear date">
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
    ],
    secondSection: {
      title: "Total Owed",
      // Se pasa directamente el número a la función de formateo
      amount:
        selectedDocs.length > 0
          ? `${formatPriceWithCurrency(selectedSum)}`
          : `${formatPriceWithCurrency(finalSumAmount)}`,
    },
    results: `${data?.totalData || 0} Results`,
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
        <h3 className="font-bold p-4">STATUS</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={[
            { name: "Acción", key: "action", important: true },
            {
              component: (
                <IoInformationCircleOutline className="text-center text-xl"  />
              ),
              key: "info", important: true
            },
            { name: "Customer", key: "customer_id", important: true },
            { name: "Type", key: "type" },
            { name: "Number", key: "number", important: true },
            { name: "Date", key: "date" },
            { name: "Amount", key: "amount", important: true },
            { name: "Balance", key: "balance" },
            { name: "Expiration", key: "expiration_date" },
            { name: "Logistic", key: "expiration_status" },
            { name: "Seller", key: "seller_id" },
          ]}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0]}
          sortOrder={(sortQuery.split(":")[1] as "asc" | "desc") || ""}
        />

        <div ref={observerRef} className="h-10" />
      </div>
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CRM
          closeModal={closeCreateModal}
          selectedClientId={selectedClientId}
        />
      </Modal>
        <Modal isOpen={isDocumentModalOpen} onClose={closeDocumentModal}>
          <DocumentDetails
            documentId={selectedDocumentId || ""}
            onClose={closeDocumentModal}
          />
        </Modal>
    </PrivateRoute>
  );
};

export default Page;

const ToggleSwitch = ({
  selected,
  onToggle,
}: {
  selected: boolean;
  onToggle: () => void;
}) => {
  return (
    <div
      onClick={onToggle}
      className={`relative inline-block w-8 h-4 cursor-pointer rounded-full transition-colors duration-300 ${
        selected ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transform transition-transform duration-300 ${
          selected ? "translate-x-4" : ""
        }`}
      ></div>
    </div>
  );
};
