"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useClient } from "@/app/context/ClientContext";
import { FaInfoCircle, FaPlus, FaTimes } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import CRM from "./CRM";
import DocumentDetails from "./DocumentDetails";
import {
  useGetAllDocumentsQuery,
  useGetCustomerInformationByCustomerIdQuery,
  useGetLookupDocumentsQuery,
} from "@/redux/services/customersInformations";
import { useSumAmountsQuery } from "@/redux/services/documentsApi";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/context/AuthContext";

// Constante para la paginación
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
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  // Para el filtro de cliente, se utiliza selectedClientId si existe
  const { selectedClientId } = useClient();
  const [customer_id, setCustomer_id] = useState("");
  const [sortQuery, setSortQuery] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
  // Estados para los nuevos filtros
  const [typeFilter, setTypeFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");

  // Estados para los modales y documento seleccionado
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDocumentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );

  // Si existe un selectedClientId, se utiliza para filtrar y se asigna a customer_id
  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
    }
  }, [selectedClientId]);

  // Si el rol es VENDEDOR, forzamos el filtro de vendedor con el seller_id del usuario y deshabilitamos el select
  useEffect(() => {
    if (userRole === "VENDEDOR" && userData?.seller_id) {
      setSellerFilter(userData.seller_id);
    }
  }, [userRole, userData]);

  // Definición de la función para abrir el modal de creación
  const openCreateModal = () => setCreateModalOpen(true);

  // Cálculo de la suma de los documentos seleccionados
  const selectedSum = selectedDocs.reduce(
    (acc, doc) => acc + Number(doc.amount),
    0
  );
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);

  // Referencia para el infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Función para formatear fechas (YYYY-MM-DD)
  function formatDate(date: Date): string | undefined {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const handleToggleSelectDocument = (document: any) => {
    const exists = selectedDocs.some((doc) => doc.key === document.id);
    if (exists) {
      setSelectedDocs((prev) => prev.filter((doc) => doc.key !== document.id));
    } else {
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
  const sortField = rawSortField;
  const sortOrder =
    rawSortOrder === "asc" || rawSortOrder === "desc"
      ? rawSortOrder
      : undefined;

  // Consulta RTK Query para documentos
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetAllDocumentsQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      startDate: startDate ? formatDate(startDate) : undefined,
      endDate: endDate ? formatDate(endDate) : undefined,
      customerId: customer_id, // Se utiliza customer_id que viene de selectedClientId o select manual
      sortField: sortField,
      sortOrder: sortOrder,
      type: typeFilter,
      sellerId: userRole === "VENDEDOR" ? userData?.seller_id : sellerFilter,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

 // ======================================================
   // Efectos
   // ======================================================
   // Actualizar lista de artículos y evitar duplicados
   useEffect(() => {
     if (data?.data) {
       setItems((prev) => {
         if (page === 1) {
           return data.data;
         }
         const newArticles = data.data.filter(
           (article) => !prev.some((item) => item.id === article.id)
         );
         return [...prev, ...newArticles];
       });
       setHasMore(data.data.length === ITEMS_PER_PAGE);
     }
   }, [data?.data, page]);
 
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
         { threshold: 0.0, rootMargin: "200px" } // Se dispara 200px antes de que el sentinel esté visible
       );
 
       if (node) observerRef.current.observe(node);
     },
     [hasMore, isQueryLoading]
   );

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

  // Handler para ordenamiento
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
    },
    [sortQuery]
  );

  // Funciones para abrir y cerrar el modal de documento
  const handleOpenDocumentModal = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setDocumentModalOpen(true);
  };

  const closeDocumentModal = () => {
    setDocumentModalOpen(false);
    setSelectedDocumentId(null);
  };

  // Mapeo de documentos para la tabla
  const tableData = items
    ?.filter((document) => {
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
        info: (
          <div className="flex justify-center items-center">
            <FaInfoCircle
              className="text-center text-xl hover:cursor-pointer hover:text-blue-500 text-green-500"
              onClick={() => handleOpenDocumentModal(document.id)}
            />
          </div>
        ),
        customer: customer
          ? `${customer.id} - ${customer.name}`
          : t("notFound"),
        type: document.type,
        number: document.number,
        date: document.date,
        amount: <div className="text-end">{formatPriceWithCurrency(document.amount)}</div>,
        balance: <div className="text-end">{formatPriceWithCurrency(document.amount)}</div>,
        expiration_date: document.expiration_date,
        expiration_status: document.expiration_status || "",
        seller_id: seller?.name || t("notFound"),
      };
    });

  // Calcula la suma de los montos de los documentos cargados
  const filteredTotal = items.reduce((acc, doc) => acc + Number(doc.amount), 0);

  // Función para formatear precios con moneda
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

  // Variable que determina si se aplicó algún filtro (incluye nuevos)
  const filterApplied = Boolean(
    startDate ||
      endDate ||
      searchQuery ||
      sortQuery ||
      typeFilter ||
      sellerFilter ||
      customer_id
  );

  // Agregar nuevos filtros al header (select para type, seller y customer)
  const headerFilters = [
    {
      // Filtro para tipo de documento
      content: (
        <select
          value={typeFilter}
          onChange={(e) => {
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
      // Filtro para cliente. Si existe selectedClientId se utiliza y se deshabilita el select.
      content: (
        <select
          value={selectedClientId || customer_id}
          onChange={(e) => {
            setCustomer_id(e.target.value);
            setPage(1);
            setItems([]);
          }}
          className="border border-gray-300 rounded p-2"
          disabled={Boolean(selectedClientId)}
        >
          <option value="">{t("allCustomers")}</option>
          {customersData &&
            customersData.map((customer: any) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
        </select>
      ),
    },
  ];

  const headerBody = {
    buttons: [
      { logo: <AiOutlineDownload />, title: t("download") },
      { logo: <FaPlus />, title: t("crm"), onClick: openCreateModal },
    ],
    filters: [
      {
        content: (
          <div className="relative">
            <DatePicker
              selected={startDate}
              onChange={(date) => {
                setStartDate(date);
                setPage(1);
                setItems([]);
              }}
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
            onChange={(date) => {
              setEndDate(date);
              setPage(1);
              setItems([]);
            }}
            placeholderText={t("dateTo")}
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      ...headerFilters,
    ],
    secondSection: {
      title: t("totalOwed"),
      amount: formatPriceWithCurrency(
        selectedSum > 0 ? selectedSum : data?.totalDocumentBalance || 0
      ),
    },
    results: t("results", { count: data?.totalData || 0 }),
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
        <h3 className="font-bold p-4">{t("statusHeader")}</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={[
            { name: t("action"), key: "action" },
            {
              component: <FaInfoCircle className="text-center text-xl" />,
              key: "info",
            },
            { name: t("customer"), key: "customer" },
            { name: t("type"), key: "type" },
            { name: t("number"), key: "number", important: true },
            { name: t("date"), key: "date" },
            { name: t("amount"), key: "amount", important: true },
            { name: t("balance"), key: "balance" },
            { name: t("expiration"), key: "expiration_date" },
            { name: t("logistic"), key: "expiration_status" },
            { name: t("seller"), key: "seller_id" },
          ]}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0]}
          sortOrder={(sortQuery.split(":")[1] as "asc" | "desc") || ""}
        />
        <div ref={lastArticleRef} className="h-10" />
      </div>
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setPage(1);
          setItems([]);
          refetch();
        }}
      >
        <CRM
          closeModal={() => {
            setCreateModalOpen(false);
            setPage(1);
            setItems([]);
            refetch();
          }}
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
