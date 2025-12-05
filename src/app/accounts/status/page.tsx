"use client";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { AiOutlineDownload } from "react-icons/ai";
import { FaInfoCircle, FaPlus, FaTimes } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";

import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import Modal from "@/app/components/components/Modal";
import CRM from "./CRM";
import DocumentDetails from "./DocumentDetails";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useClient } from "@/app/context/ClientContext";
import { useAuth } from "@/app/context/AuthContext";

import {
  useGetAllDocumentsQuery,
  useLazyExportDocumentsQuery,
} from "@/redux/services/customersInformations";
import {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
} from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetUsersQuery } from "@/redux/services/usersApi";

// Constants
const ITEMS_PER_PAGE = 15;
const DOCUMENT_TYPES = [
  "FACTURA A",
  "FACTURA B",
  "Nota de Crédito A",
  "Nota de Crédito B",
  "Recibo de cobranza",
];

// ToggleSwitch component
const ToggleSwitch = ({
  selected,
  onToggle,
}: {
  selected: boolean;
  onToggle: () => void;
}) => (
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
    />
  </div>
);

export default function Page() {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const { selectedClientId } = useClient();

  // Derived
  const userRole = useMemo(
    () => userData?.role?.toUpperCase() || "",
    [userData]
  );
  const forcedSellerId = useMemo(
    () => (userRole === "VENDEDOR" ? userData?.seller_id : undefined),
    [userRole, userData]
  );
  const { data: customerData } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

  const latestHighInstance = useMemo(() => {
    const arr = Array.isArray(customerData?.instance)
      ? customerData.instance
      : [];
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i]?.priority === "HIGH") return arr[i];
    }
    return null;
  }, [customerData]);

  // State
  const [page, setPage] = useState(1);
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  // const [sellerFilter, setSellerFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>(
    selectedClientId || ""
  );
  const [sortQuery, setSortQuery] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<
    { key: string; amount: number }[]
  >([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [triggerExport, { isFetching }] = useLazyExportDocumentsQuery();
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(null);
  const users = usersData || [];
  const getSellerLabel = (seller: any) => {
    const user = users.find((u: any) => u.seller_id === seller.id);
    const nameToShow = user?.username || seller.name || seller.id;
    return `${nameToShow} (${seller.id})`;
  };

  const handleDownload = async () => {
    const blob = await triggerExport({
      sortField: sortQuery?.split(":")[0],
      sortOrder: (sortQuery?.split(":")[1] as "asc" | "desc") || "desc",
      startDate: startDate?.toISOString().slice(0, 10),
      endDate: endDate?.toISOString().slice(0, 10),
      customerId: customerFilter || undefined,
      // sellerId: forcedSellerId || sellerFilter || undefined,
      type: typeFilter || undefined,
    }).unwrap();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documentos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Sync client filter
  useEffect(() => {
    if (selectedClientId) {
      setCustomerFilter(selectedClientId);
    }
  }, [selectedClientId]);

  // Reset list on filter change
  const resetList = useCallback(() => {
    setPage(1);
    setSelectedDocs([]);
    setAllDocs([]);
  }, []);

  // Fetch documents
  const { data: documentsData, isLoading } = useGetAllDocumentsQuery(
    useMemo(
      () => ({
        page,
        limit: ITEMS_PER_PAGE,
        startDate: startDate?.toISOString().slice(0, 10),
        endDate: endDate?.toISOString().slice(0, 10),
        customerId: customerFilter,
        // sellerId: forcedSellerId || sellerFilter,
        type: typeFilter,
        ...(sortQuery
          ? {
              sortField: sortQuery.split(":")[0],
              sortOrder: sortQuery.split(":")[1] as "asc" | "desc",
            }
          : {}),
      }),
      [
        page,
        startDate,
        endDate,
        customerFilter,
        forcedSellerId,
        // sellerFilter,
        typeFilter,
        sortQuery,
      ]
    ),
    { refetchOnMountOrArgChange: true }
  );

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);

  // Accumulate documents
  useEffect(() => {
    if (!documentsData?.data) return;
    if (page === 1) {
      setAllDocs(documentsData.data);
    } else {
      setAllDocs((prev) => [...prev, ...documentsData.data]);
    }
  }, [documentsData, page]);

  // Infinite scroll
  const observer = useRef<IntersectionObserver>();
  const lastItemRef = useCallback(
    (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          const hasMore = (documentsData?.totalData || 0) > allDocs.length;
          if (entries[0].isIntersecting && hasMore) {
            setPage((p) => p + 1);
          }
        },
        { rootMargin: "200px" }
      );
      if (node) observer.current.observe(node);
    },
    [documentsData, allDocs.length]
  );

  // Format currency
  function formatCurrency(value: number) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    })
      .format(value)
      .replace("ARS", "");
  }

  // Toggle select
  const toggleSelect = useCallback((doc: any) => {
    setSelectedDocs((prev) => {
      const exists = prev.some((d) => d.key === doc.id);
      return exists
        ? prev.filter((d) => d.key !== doc.id)
        : [...prev, { key: doc.id, amount: Number(doc.amount) }];
    });
  }, []);

  // Modals
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => setCreateModalOpen(false);
  const openDocModal = (id: string) => {
    setSelectedDocumentId(id);
    setDocModalOpen(true);
  };
  const closeDocModal = () => {
    setDocModalOpen(false);
    setSelectedDocumentId(null);
  };

  // Sort handler
  const handleSort = useCallback(
    (field: string) => {
      setSortQuery((prev) => {
        const [f, d] = prev.split(":");
        const newDir = f === field && d === "asc" ? "desc" : "asc";
        return `${field}:${newDir}`;
      });
      resetList();
    },
    [resetList]
  );

  // Sum of selected
  const selectedSum = useMemo(
    () => selectedDocs.reduce((sum, d) => sum + d.amount, 0),
    [selectedDocs]
  );

  const canCreate = userRole === "ADMINISTRADOR";

  // Header filters
  const headerFilters = useMemo(
    () => [
      {
        content: (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {/* Fecha desde */}
            <div className="relative flex-1 min-w-0">
              <DatePicker
                selected={startDate}
                onChange={(d) => {
                  setStartDate(d);
                  resetList();
                }}
                placeholderText={t("dateFrom")}
                dateFormat="yyyy-MM-dd"
                className="w-full border rounded p-2"
              />
              {startDate && (
                <FaTimes
                  className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setStartDate(null);
                    resetList();
                  }}
                />
              )}
            </div>

            {/* Fecha hasta */}
            <div className="relative flex-1 min-w-0">
              <DatePicker
                selected={endDate}
                onChange={(d) => {
                  setEndDate(d);
                  resetList();
                }}
                placeholderText={t("dateTo")}
                dateFormat="yyyy-MM-dd"
                className="w-full border rounded p-2"
              />
              {endDate && (
                <FaTimes
                  className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setEndDate(null);
                    resetList();
                  }}
                />
              )}
            </div>
          </div>
        ),
      },
      {
        content: (
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              resetList();
            }}
            className="w-full border rounded p-2"
          >
            <option value="">{t("allTypes")}</option>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        ),
      },
      // {
      //   content: (
      //     <select
      //       value={forcedSellerId || sellerFilter}
      //       onChange={(e) => {
      //         // Si está bloqueado por rol, forcedSellerId o todavía está cargando users, no hacemos nada
      //         if (forcedSellerId || userRole === "CUSTOMER" || isLoadingUsers)
      //           return;

      //         setSellerFilter(e.target.value);
      //         resetList();
      //       }}
      //       disabled={
      //         !!forcedSellerId || userRole === "CUSTOMER" || isLoadingUsers
      //       }
      //       className="w-full border rounded p-2"
      //     >
      //       <option value="">{t("allSellers")}</option>
      //       {sellersData?.map((s) => (
      //         <option key={s.id} value={s.id}>
      //           {getSellerLabel(s)}
      //         </option>
      //       ))}
      //     </select>
      //   ),
      // },
      {
        content: (
          <select
            value={customerFilter}
            onChange={(e) => {
              setCustomerFilter(e.target.value);
              resetList();
            }}
            disabled={!!selectedClientId}
            className="w-full border rounded p-2"
          >
            <option value="">{t("allCustomers")}</option>
            {customersData?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ),
      },
    ],
    [
      startDate,
      endDate,
      typeFilter,
      // sellerFilter,
      customerFilter,
      forcedSellerId,
      selectedClientId,
      customersData,
      sellersData,
      t,
      resetList,
    ]
  );

  // Table data from allDocs
  // Table data from allDocs
  const tableData = useMemo(
    () =>
      allDocs.map((doc) => {
        const isSelected = selectedDocs.some((d) => d.key === doc.id);
        const customer = customersData?.find((c) => c.id === doc.customer_id);
        const seller = sellersData?.find((s) => s.id === doc.seller_id);

        // --- lógica color ---
        const isInvoice = (doc.type || "").toUpperCase().startsWith("FACTURA");
        const expirationDate = doc.expiration_date
          ? new Date(doc.expiration_date)
          : null;

        // Si está vencida: fecha < hoy
        const isExpired =
          isInvoice &&
          expirationDate !== null &&
          expirationDate.getTime() < new Date().setHours(0, 0, 0, 0);
        const amountNumber = Number(doc.amount);
        const formattedAmount = formatCurrency(amountNumber);

        const amountCell = isInvoice ? (
          <span
            className={`font-semibold ${
              isExpired ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {formattedAmount}
          </span>
        ) : (
          formattedAmount
        );

        const balanceCell = isInvoice ? (
          <span
            className={`font-semibold ${
              isExpired ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {formattedAmount}
          </span>
        ) : (
          formattedAmount
        );
        // --- fin lógica color ---

        return {
          key: `${doc.date} - ${customer?.name}`,
          action: (
            <ToggleSwitch
              selected={isSelected}
              onToggle={() => toggleSelect(doc)}
            />
          ),
          info: (
            <FaInfoCircle
              className="cursor-pointer text-xl text-green-500 hover:text-blue-500"
              onClick={() => openDocModal(doc.id)}
            />
          ),
          customer: customer
            ? `${customer.id} - ${customer.name}`
            : t("notFound"),
          type: doc.type,
          number: doc.number,
          date: doc.date,
          amount: amountCell,
          balance: balanceCell,
          expiration_date: doc.expiration_date,
          expiration_status: doc.expiration_status || "",
          seller_id: seller?.name || t("notFound"),
        };
      }),
    [allDocs, customersData, sellersData, selectedDocs, t, toggleSelect]
  );

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
      <div className="space-y-4 mt-4">
        <h3 className="font-bold p-4">{t("statusAccount")}</h3>
        <Header
          headerBody={{
            buttons: [
              {
                logo: <AiOutlineDownload />,
                title: isFetching ? t("downloading") : t("download"),
                onClick: handleDownload,
                // si tu <Header> soporta deshabilitar:
                disabled: isFetching,
              },
              ...(canCreate && selectedClientId
                ? [
                    {
                      logo: <FaPlus />,
                      title: t("crm"),
                      onClick: openCreateModal,
                    },
                  ]
                : []),
            ],
            filters: headerFilters,
            secondSection: {
              title: t("totalOwed"),
              amount: formatCurrency(
                selectedSum || documentsData?.totalDocumentBalance || 0
              ),
            },
            results: t("results", { count: documentsData?.totalData || 0 }),
          }}
        />
        {canCreate && selectedClientId && latestHighInstance && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 mx-4 py-3 flex items-start gap-3">
            <span
              className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-red-500"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-red-800">
                  {t("highPriorityInstance") || "Instancia de ALTA prioridad"}
                </span>
                {latestHighInstance.type && (
                  <span className="text-xs rounded-full bg-red-100 text-red-800 ring-1 ring-inset ring-red-200 px-2 py-0.5">
                    {t("type")}: {latestHighInstance.type}
                  </span>
                )}
              </div>
              <p
                className="mt-1 text-sm text-red-900 line-clamp-2"
                title={latestHighInstance.notes || ""}
              >
                <span className="font-medium">{t("notes")}:</span>{" "}
                {latestHighInstance.notes || t("none")}
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              {t("crm")}
            </button>
          </div>
        )}

        {!isLoading && allDocs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {t("noDocumentsFound") || "No se encontraron documentos."}
          </div>
        ) : (
          <>
            <Table
              headers={[
                { name: t("action"), key: "action" },
                {
                  component: <FaInfoCircle className="text-xl" />,
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
              sortOrder={
                (sortQuery.split(":")[1] as "asc" | "desc") || undefined
              }
            />
            <div ref={lastItemRef} className="h-8" />
          </>
        )}
      </div>
      {canCreate && selectedClientId && (
        <Modal isOpen={createModalOpen} onClose={closeCreateModal}>
          <CRM
            closeModal={closeCreateModal}
            selectedClientId={selectedClientId}
          />
        </Modal>
      )}

      <Modal isOpen={docModalOpen} onClose={closeDocModal}>
        <DocumentDetails
          documentId={selectedDocumentId || ""}
          onClose={closeDocModal}
        />
      </Modal>
    </PrivateRoute>
  );
}
