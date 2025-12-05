"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { IoMdPin } from "react-icons/io";
import { FaInfoCircle } from "react-icons/fa";
import DatePicker from "react-datepicker";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  useGetCrmPagQuery,
  useLazyExportCrmQuery,
} from "@/redux/services/crmApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import PrivateRoute from "../context/PrivateRoutes";
import Modal from "../components/components/Modal";
import { useClient } from "../context/ClientContext";
import { useTranslation } from "react-i18next";
import debounce from "../context/debounce";
import { FiMapPin } from "react-icons/fi";
import MapComponent from "./Map";
import CRMDetail from "./CRMDetail";
import { useGetOrdersQuery } from "@/redux/services/ordersApi";
import { useAuth } from "../context/AuthContext";
import MapModal from "./MapModal";
import { useGetUsersQuery } from "@/redux/services/usersApi";
import { AiOutlineDownload } from "react-icons/ai";
import { FaPlus } from "react-icons/fa";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import CRM from "../accounts/status/CRM";

const useCrmTypeLabel = () => {
  const { t } = useTranslation();

  const getCrmTypeKey = (type?: string) => {
    const key = (type || "").toUpperCase();
    switch (key) {
      case "COLLECTION":
        return "crmType.collection";
      case "ORDER":
        return "crmType.order";
      case "VISIT":
        return "crmType.visit";
      case "EMAIL":
        return "crmType.email";
      case "CALL":
        return "crmType.call";
      case "MESSAGE":
        return "crmType.message";
      case "RECLAIM":
        return "crmType.reclaim";
      default:
        return "crmType.unknown";
    }
  };

  const getCrmTypeLabel = (type?: string) => t(getCrmTypeKey(type));

  return { getCrmTypeLabel };
};

const ITEMS_PER_PAGE = 15;
const keyOf = (o: unknown) => JSON.stringify(o);

const Page = () => {
  const { t } = useTranslation();

  // -------- Context / Auth --------
  const { selectedClientId } = useClient();
  const { userData } = useAuth();
  const userRole = (userData?.role || "").toUpperCase();

  // -------- Filtros / estado UI --------
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sellerFilter, setSellerFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>("");
  const [resetSeq, setResetSeq] = useState(0); // versión de filtros

  // -------- Modales --------
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isViewGPSModalOpen, setViewGPSModalOpen] = useState(false);
  const [currentGPS, setCurrentGPS] = useState<string | null>(null);
  const [isViewAllMapModalOpen, setViewAllMapModalOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    type: "update" | "delete" | "info" | null;
    crm: any | null;
  }>({ type: null, crm: null });
  // NUEVO: filtro por comentarios predefinidos (solo aplica a VISIT)
  const [predefOpen, setPredefOpen] = useState(false);
  const [predefSelected, setPredefSelected] = useState<string[]>([]); // guarda SOLO hojas (rutas completas)

  // -------- Datos relacionados --------
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data: ordersData } = useGetOrdersQuery(null);
  const { data: usersData } = useGetUsersQuery(null);
  const users = usersData || [];

  const getSellerLabel = (seller: any) => {
    if (!seller) return t("notAvailable");
    const user = users.find((u: any) => u.seller_id === seller.id);
    const nameToShow = user?.username || seller?.name || seller?.id;
    return `${nameToShow} (${seller.id})`;
  };
  // -------- Filtro por rol vendedor --------
  useEffect(() => {
    if (userRole === "VENDEDOR" && userData?.seller_id) {
      setSellerFilter(userData.seller_id);
    }
  }, [userRole, userData]);

  // -------- Cliente seleccionado (para instancias) --------
  const { data: customerData } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );
  const { getCrmTypeLabel } = useCrmTypeLabel();

  // Última instancia HIGH (sin created_at): recorre desde el final
  const latestHighInstance = useMemo(() => {
    const arr = Array.isArray(customerData?.instance)
      ? customerData.instance
      : [];
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i]?.priority === "HIGH") return arr[i];
    }
    return null;
  }, [customerData]);

  // Permite cerrar/ocultar el banner localmente
  const [hideHighBanner, setHideHighBanner] = useState(false);
  useEffect(() => {
    // si cambia de cliente, mostramos de nuevo
    setHideHighBanner(false);
  }, [selectedClientId]);

  // -------- Filtro por cliente desde contexto --------
  const [customer_id, setCustomer_id] = useState("");
  useEffect(() => {
    setCustomer_id(selectedClientId || "");
    // cada cambio de cliente resetea paginación
    setPage(1);
    setItems([]);
    setHasMore(true);
    setResetSeq((s) => s + 1);
  }, [selectedClientId]);

  // -------- Export --------
  const [exportCrm, { isFetching: isExporting }] = useLazyExportCrmQuery();
  const handleExport = async () => {
    try {
      const blob = await exportCrm({
        startDate: startDate ? startOfDay(startDate).toISOString() : undefined,
        endDate: endDate ? endOfDay(endDate).toISOString() : undefined,
        status: undefined,
        type: typeFilter || undefined,
        insitu: "",
        customer_id: customer_id || undefined,
        sort: sortQuery || undefined,
        seller_id: sellerFilter || undefined,
        user_id: undefined,
        action: undefined,
        search: searchQuery || undefined,
        ...(typeFilter === "VISIT" && predefSelected.length > 0
          ? { commentsFilter: predefSelected }
          : {}),
      }).unwrap();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fileName =
        `crm` +
        `${startDate ? "_" + format(startDate, "yyyy-MM-dd") : ""}` +
        `${endDate ? "_" + format(endDate, "yyyy-MM-dd") : ""}.xlsx`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error exportando CRM", e);
    }
  };

  // -------- Helpers --------
  const formatCurrency = (value: any) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const resetPagination = useCallback(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    setResetSeq((s) => s + 1); // cambia key de cache y anula respuestas viejas
  }, []);

  // -------- Handlers filtros --------
  const handleDateChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<Date | null>>) =>
      (date: Date | null) => {
        setter(date);
        resetPagination();
      },
    [resetPagination]
  );

  const handleFilterChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setter(e.target.value);
        resetPagination();
      },
    [resetPagination]
  );

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
      resetPagination();
    }, 500),
    [resetPagination]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch]
  );

  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery
        ? sortQuery.split(":")
        : ["", ""];
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

  const sameArray = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const A = [...a].sort();
    const B = [...b].sort();
    for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
    return true;
  };

  // -------- Args para query principal (mem) --------
  const listArgs = useMemo(() => {
    const args: any = {
      page,
      limit: ITEMS_PER_PAGE,
      startDate: startDate ? startOfDay(startDate).toISOString() : undefined,
      endDate: endDate ? endOfDay(endDate).toISOString() : undefined,
      type: typeFilter || undefined,
      insitu: "",
      customer_id: customer_id || undefined,
      seller_id: sellerFilter || undefined,
      search: searchQuery || undefined,
      sort: sortQuery || undefined,
      __v: resetSeq, // token
    };

    if (typeFilter === "VISIT" && predefSelected.length > 0) {
      args.commentsFilter = predefSelected;
    }

    return args;
  }, [
    page,
    startDate,
    endDate,
    typeFilter,
    customer_id,
    sellerFilter,
    searchQuery,
    sortQuery,
    resetSeq,
  ]);

  // guardo la key actual para descartar respuestas viejas
  const currentKeyRef = useRef(keyOf(listArgs));
  useEffect(() => {
    currentKeyRef.current = keyOf(listArgs);
  }, [listArgs]);

  // -------- Query principal --------
  const {
    data,
    error,
    isLoading: isQueryLoading,
    isFetching,
  } = useGetCrmPagQuery(listArgs, {
    refetchOnMountOrArgChange: true,
  });

  // -------- Query para “ver en mapa” desacoplada del infinito --------
  const mapArgs = useMemo(
    () => ({
      page: 1,
      limit: 1000,
      startDate: startDate ? startOfDay(startDate).toISOString() : undefined,
      endDate: endDate ? endOfDay(endDate).toISOString() : undefined,
      type: "VISIT" as const,
      insitu: "",
      customer_id: customer_id || undefined,
      seller_id: sellerFilter || undefined,
      search: searchQuery || undefined,
      sort: sortQuery || undefined,
      __v: resetSeq,
    }),
    [
      startDate,
      endDate,
      customer_id,
      sellerFilter,
      searchQuery,
      sortQuery,
      resetSeq,
    ]
  );

  const { data: allVisitsData } = useGetCrmPagQuery(mapArgs, {
    refetchOnMountOrArgChange: true,
  });
  const markersVisits = allVisitsData?.crms || [];

  // -------- Acumulación segura con control de staleness --------
  useEffect(() => {
    if (!data?.crms) return;
    if (keyOf(listArgs) !== currentKeyRef.current) return; // respuesta vieja

    setItems((prev) => {
      if (page === 1) return data.crms;
      const newOnes = data.crms.filter(
        (row: any) => !prev.some((p) => p._id === row._id)
      );
      return [...prev, ...newOnes];
    });
    setHasMore(data.crms.length === ITEMS_PER_PAGE);
  }, [data?.crms, listArgs, page]);

  // -------- IntersectionObserver para infinito --------
  const observerRef = useRef<IntersectionObserver | null>(null);
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

  // -------- Abrir/cerrar modales --------
  const openCreateModal = useCallback(() => setCreateModalOpen(true), []);
  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    // tras crear, reseteo paginación para traer datos frescos
    resetPagination();
  }, [resetPagination]);

  const openViewGPSModal = (gps: string) => {
    setCurrentGPS(gps);
    setViewGPSModalOpen(true);
  };
  const closeViewGPSModal = () => {
    setViewGPSModalOpen(false);
    setCurrentGPS(null);
  };

  const handleModalOpen = useCallback(
    (type: "update" | "delete" | "info", crm: any) => {
      setModalState({ type, crm });
    },
    []
  );
  const handleModalClose = useCallback(
    (type: "update" | "delete" | "info") => {
      setModalState({ type: null, crm: null });
      // si el modal modifica datos, preferible resetear:
      if (type !== "info") resetPagination();
    },
    [resetPagination]
  );

  // -------- Mapeo de tabla --------
  const tableData = useMemo(
    () =>
      items?.map((crm) => {
        const customer = customersData?.find((d) => d.id === crm.customer_id);
        const seller = sellersData?.find((d) => d.id === crm.seller_id);
        const order = ordersData?.find((d) => d.tmp_id === crm.order_id);
        const user = usersData?.find((d) => d._id === crm.user_id);
        return {
          key: crm._id,
          info: (
            <div className="flex justify-center items-center">
              <FaInfoCircle
                className="text-center text-xl hover:cursor-pointer hover:text-blue-500 text-green-500"
                onClick={() => handleModalOpen("info", crm)}
              />
            </div>
          ),
          seller: seller ? getSellerLabel(seller) : t("notAvailable"),

          customer: customer?.name || t("notAvailable"),
          user: user?.username || customer?.name || t("notAvailable"),
          date: crm.date
            ? format(new Date(crm.date), "yyyy-MM-dd HH:mm")
            : t("notAvailable"),
          type: getCrmTypeLabel(crm.type),
          number: order?.multisoft_id || t("-"),
          amount:
            order?.total != null && !isNaN(order.total)
              ? formatCurrency(order.total)
              : "-",
          notes: crm.notes || t("notAvailable"),
          gps: crm.gps ? (
            <FiMapPin
              onClick={() => openViewGPSModal(crm.gps)}
              className="text-center font-bold text-3xl text-white hover:cursor-pointer hover:text-black bg-green-400  p-1.5 rounded-sm"
            />
          ) : (
            "No GPS"
          ),
        };
      }) || [],
    [items, customersData, sellersData, ordersData, usersData, t]
  );

  const tableHeader = useMemo(
    () => [
      {
        component: (
          <IoInformationCircleOutline className="text-center text-xl" />
        ),
        key: "info",
      },
      { name: t("seller"), key: "seller", important: true },
      { name: t("customer"), key: "customer", important: true },
      { name: t("user"), key: "user" },
      { name: t("date"), key: "date" },
      { name: t("type"), key: "type", important: true },
      { name: t("number"), key: "number", important: true },
      { name: t("amount"), key: "amount" },
      { name: t("notes"), key: "notes" },
      { name: t("gps"), key: "gps" },
    ],
    [t]
  );

  const canCreate = userRole === "ADMINISTRADOR";

  // -------- Header config --------
  const headerBody = useMemo(
    () => ({
      buttons: [
        {
          logo: (
            <AiOutlineDownload className={isExporting ? "animate-spin" : ""} />
          ),
          title: isExporting
            ? t("exporting") || "Exportando..."
            : t("download") || "Descargar",
          onClick: handleExport,
          disabled: isExporting,
        },
        {
          logo: <IoMdPin />,
          title: t("viewOnMap"),
          onClick: () => setViewAllMapModalOpen(true),
        },
        ...(typeFilter === "VISIT"
          ? [
              {
                logo: <FaInfoCircle />,
                title:
                  (t("commentsFilter") as string) ||
                  `Comentarios${
                    predefSelected.length ? ` (${predefSelected.length})` : ""
                  }`,
                onClick: () => setPredefOpen((v) => !v),
              },
            ]
          : []),
        ...(canCreate
          ? [
              {
                logo: <FaPlus />,
                title: t("CRM Cobranzas"),
                onClick: () => setCreateModalOpen(true),
              },
            ]
          : []),
      ],
      filters: [
        {
          content: (
            <DatePicker
              selected={startDate}
              onChange={handleDateChange(setStartDate)}
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
              onChange={handleDateChange(setEndDate)}
              placeholderText={t("dateTo")}
              dateFormat="yyyy-MM-dd"
              className="border border-gray-300 rounded p-2"
            />
          ),
        },
        {
          content: (
            <select
              value={
                userRole === "VENDEDOR" ? userData?.seller_id : sellerFilter
              }
              onChange={(e) => {
                if (userRole !== "VENDEDOR") {
                  setSellerFilter(e.target.value);
                  resetPagination();
                }
              }}
              className="border border-gray-300 rounded p-2"
              disabled={userRole === "VENDEDOR"}
            >
              <option value="">{t("allSellers")}</option>
              {sellersData?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {getSellerLabel(s)}
                </option>
              ))}
            </select>
          ),
        },

        {
          content: (
            <select
              value={typeFilter}
              onChange={handleFilterChange(setTypeFilter)}
              className="border border-gray-300 rounded p-2"
            >
              <option value="">{t("type")}</option>
              <option value="VISIT">VISITA</option>
              <option value="ORDER">PEDIDO</option>
              <option value="RECLAIM">RECLAMO</option>
            </select>
          ),
        },
        // Buscador (si lo usás):
        // {
        //   content: (
        //     <input
        //       type="text"
        //       placeholder={t("searchPlaceholder")}
        //       defaultValue={searchQuery}
        //       onChange={handleSearchChange}
        //       className="border border-gray-300 rounded p-2"
        //       style={{ width: "120px" }}
        //     />
        //   ),
        // },
      ],
      results: `${t("results", { count: data?.total || 0 })}`,
    }),
    [
      t,
      startDate,
      endDate,
      sellerFilter,
      typeFilter,
      // searchQuery, // si activás el buscador, incluí acá
      isExporting,
      data?.total,
      sellersData,
      userRole,
      userData?.seller_id,
      handleDateChange,
      handleFilterChange,
      handleSearchChange,
      resetPagination,
    ]
  );

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {t("errorLoadingData")}: {JSON.stringify(error)}
      </div>
    );
  }

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("crm.title")}</h3>
        <Header headerBody={headerBody} />

        {predefOpen && typeFilter === "VISIT" && (
          <div className="mx-4 mb-3 rounded-lg border border-zinc-800 bg-zinc-900">
            {/* ... */}
            <div className="px-3 pb-3">
              <PredefinedCommentsTreeFilter
                selectedLeafs={predefSelected}
                onChange={(leafs) => {
                  // 👇 Solo setear si cambió
                  if (!sameArray(leafs, predefSelected)) {
                    setPredefSelected(leafs);
                    resetPagination();
                  }
                }}
              />
            </div>
          </div>
        )}
        {!hideHighBanner && latestHighInstance && canCreate && (
          <div className="mx-4 my-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <span
              className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-red-500"
              aria-hidden="true"
            />

            <div className="flex-1 min-w-0">
              {/* Título y tipo */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-red-800">
                  {t("crm.highPriorityInstance")}
                </span>

                {latestHighInstance.type && (
                  <span className="text-xs rounded-full bg-red-100 text-red-800 ring-1 ring-inset ring-red-200 px-2 py-0.5">
                    {t("crm.typeLabel")}:{" "}
                    {t(
                      `crm.types.${latestHighInstance.type}`,
                      latestHighInstance.type
                    )}
                  </span>
                )}
              </div>

              {/* Nota */}
              <p
                className="mt-1 text-sm text-red-900 line-clamp-2"
                title={latestHighInstance.notes || ""}
              >
                <span className="font-medium">{t("crm.noteLabel")}:</span>{" "}
                {latestHighInstance.notes || t("crm.none")}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                {t("crm.openCRM")}
              </button>

              <button
                onClick={() => setHideHighBanner(true)}
                className="shrink-0 rounded-md bg-white px-2 py-1.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-100"
                aria-label={t("close")}
                title={t("close") as string}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {isQueryLoading && page === 1 ? (
          <div className="p-4 text-center">{t("loading")}</div>
        ) : (
          <Table
            headers={tableHeader}
            data={tableData}
            onSort={handleSort}
            sortField={sortQuery.split(":")[0] || ""}
            sortOrder={(sortQuery.split(":")[1] as "asc" | "desc") || ""}
          />
        )}
      </div>

      {/* sentinel para infinito */}
      <div ref={lastArticleRef} className="h-10" />

      {/* Modal crear */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CRM
          closeModal={closeCreateModal}
          selectedClientId={selectedClientId}
        />
      </Modal>

      {/* Modal ver GPS puntual */}
      {isViewGPSModalOpen && currentGPS && (
        <Modal isOpen={isViewGPSModalOpen} onClose={closeViewGPSModal}>
          <MapComponent
            currentGPS={currentGPS}
            closeModal={closeViewGPSModal}
          />
        </Modal>
      )}

      {/* Modal ver todo en mapa */}
      {isViewAllMapModalOpen && (
        <Modal
          isOpen={isViewAllMapModalOpen}
          onClose={() => setViewAllMapModalOpen(false)}
        >
          <MapModal
            visit={markersVisits}
            onClose={() => setViewAllMapModalOpen(false)}
          />
        </Modal>
      )}

      {/* Modal detalles CRM */}
      <Modal
        isOpen={modalState.type === "info"}
        onClose={() => handleModalClose("info")}
      >
        {modalState.crm && (
          <CRMDetail
            data={modalState.crm}
            onClose={() => handleModalClose("info")}
          />
        )}
      </Modal>
    </PrivateRoute>
  );
};
type Node = { label: string; children?: Node[] };

const PREDEFINED_TREE: Node[] = [
  {
    label: "Venta realizada",
    children: [
      { label: "Lubricantes" },
      { label: "Filtros" },
      { label: "Cubiertas" },
      { label: "Baterías" },
      { label: "Autopartes" },
      { label: "Aditivos" },
    ],
  },
  {
    label: "No venta",
    children: [
      {
        label: "Lubricantes",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Total" },
              { label: "ELF" },
              { label: "YPF" },
              { label: "Shell" },
              { label: "Castrol" },
              { label: "Motul" },
              { label: "Petronas" },
              { label: "Valvoline" },
              { label: "Gulf" },
              { label: "Otro" },
            ],
          },
        ],
      },
      {
        label: "Filtros",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Mahle" },
              { label: "Fram" },
              { label: "Maan" },
              { label: "Wega" },
              { label: "Bosch" },
              { label: "Acdelco" },
              { label: "WIX" },
              { label: "Otro" },
            ],
          },
        ],
      },
      {
        label: "Cubiertas",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Dunlop" },
              { label: "Corven" },
              { label: "Chaoyang" },
              { label: "Pirelli" },
              { label: "Fate" },
              { label: "Firestone" },
              { label: "Goodyear" },
              { label: "Michelin" },
              { label: "Otro" },
            ],
          },
        ],
      },
      {
        label: "Baterías",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Moura" },
              { label: "Willard" },
              { label: "Bosch" },
              { label: "Heliar" },
              { label: "Prestolite" },
              { label: "Varta" },
              { label: "Otro" },
            ],
          },
        ],
      },
      {
        label: "Autopartes",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Corven" },
              { label: "Nakata" },
              { label: "SKF" },
              { label: "Monroe" },
              { label: "Sachs" },
              { label: "Sadar" },
              { label: "Fric Rot" },
              { label: "Otro" },
            ],
          },
        ],
      },
      {
        label: "Aditivos",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Liqui Moly" },
              { label: "Molykote" },
              { label: "Ceramo" },
              { label: "Mannol" },
              { label: "Bardahl" },
              { label: "Wynn´s" },
              { label: "STP" },
              { label: "Otro" },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Cobranza",
    children: [
      { label: "Cobro total" },
      { label: "Cobro parcial" },
      { label: "Cliente incobrable" },
    ],
  },
  {
    label: "Prospección / Cliente nuevo",
    children: [
      { label: "Se pudo dar de alta" },
      { label: "Hubo interés" },
      { label: "Se hizo alguna venta inicial" },
    ],
  },
];

function gatherLeafPaths(node: Node, prefix = ""): string[] {
  const path = prefix ? `${prefix} > ${node.label}` : node.label;
  if (!node.children?.length) return [path];
  return node.children.flatMap((c) => gatherLeafPaths(c, path));
}
function gatherAllPaths(node: Node, prefix = ""): string[] {
  const path = prefix ? `${prefix} > ${node.label}` : node.label;
  if (!node.children?.length) return [path];
  return [path, ...node.children.flatMap((c) => gatherAllPaths(c, path))];
}
function computeTriState(node: Node, checked: Set<string>, prefix = "") {
  const leafs = gatherLeafPaths(node, prefix);
  const selected = leafs.filter((p) => checked.has(p)).length;
  const all = leafs.length;
  return {
    checked: all > 0 && selected === all,
    indeterminate: selected > 0 && selected < all,
  };
}

function PredefinedCommentsTreeFilter({
  selectedLeafs,
  onChange,
}: {
  selectedLeafs: string[];
  onChange: (leafs: string[]) => void;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedLeafs));
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const lastEmittedRef = useRef<string>(""); // 👈 guarda último payload emitido

  // 🔁 Si cambian las props desde afuera, sincronizá 'checked' SOLO si difieren
  useEffect(() => {
    const curr = Array.from(checked).sort();
    const next = [...selectedLeafs].sort();
    if (curr.length !== next.length || curr.some((v, i) => v !== next[i])) {
      setChecked(new Set(selectedLeafs));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeafs]);

  // 🧠 Emití solo si hay diferencia real vs último emitido
  useEffect(() => {
    const leafsOnly = Array.from(checked).filter(
      (path) =>
        !Array.from(checked).some(
          (o) => o !== path && o.startsWith(path + " > ")
        )
    );
    const payload = JSON.stringify([...leafsOnly].sort());
    if (payload !== lastEmittedRef.current) {
      lastEmittedRef.current = payload;
      onChange(leafsOnly);
    }
  }, [checked, onChange]);

  const toggleNode = (node: Node, prefix = "") => {
    const paths = gatherAllPaths(node, prefix); // padre + hijos
    const leafs = gatherLeafPaths(node, prefix);
    setChecked((prev) => {
      const next = new Set(prev);
      const anyLeafSelected = leafs.some((p) => next.has(p));
      if (anyLeafSelected) {
        // deselecciona TODAS las hojas de esa rama
        leafs.forEach((p) => next.delete(p));
      } else {
        // selecciona TODAS las hojas de esa rama
        leafs.forEach((p) => next.add(p));
      }
      // limpiamos posibles padres residuales (por si vinieran en selectedLeafs)
      paths.forEach((p) => {
        if (next.has(p) && !leafs.includes(p)) next.delete(p);
      });
      return next;
    });
  };

  const expandAll = () => {
    const map: Record<string, boolean> = {};
    const walk = (n: Node, prefix = "") => {
      const path = prefix ? `${prefix} > ${n.label}` : n.label;
      map[path] = true;
      n.children?.forEach((c) => walk(c, path));
    };
    PREDEFINED_TREE.forEach((n) => walk(n));
    setOpenMap(map);
  };
  const collapseAll = () => setOpenMap({});
  const clear = () => setChecked(new Set());

  return (
    <div className="rounded-md bg-zinc-900/40">
      <div className="flex items-center gap-2 py-2">
        <button
          onClick={expandAll}
          className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
        >
          Expandir todo
        </button>
        <button
          onClick={collapseAll}
          className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
        >
          Contraer todo
        </button>
        <button
          onClick={clear}
          className="ml-auto text-xs px-2 py-1 rounded bg-red-600/80 text-white hover:bg-red-600"
        >
          Limpiar selección
        </button>
      </div>

      <div className="space-y-1">
        {PREDEFINED_TREE.map((node) => (
          <TreeNodeUI
            key={node.label}
            node={node}
            prefix=""
            openMap={openMap}
            setOpenMap={setOpenMap}
            checked={checked}
            onToggle={toggleNode}
          />
        ))}
      </div>
    </div>
  );
}

function TreeNodeUI({
  node,
  prefix,
  openMap,
  setOpenMap,
  checked,
  onToggle,
}: {
  node: Node;
  prefix: string;
  openMap: Record<string, boolean>;
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  checked: Set<string>;
  onToggle: (node: Node, prefix?: string) => void;
}) {
  const path = prefix ? `${prefix} > ${node.label}` : node.label;
  const hasChildren = !!node.children?.length;
  const { checked: isChecked, indeterminate } = computeTriState(
    node,
    checked,
    prefix
  );
  const isOpen = !!openMap[path];

  const cbRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (cbRef.current)
      cbRef.current.indeterminate = indeterminate && !isChecked;
  }, [indeterminate, isChecked]);

  return (
    <div className="pl-1">
      <div className="group flex items-center gap-2 py-1 pr-2 rounded hover:bg-zinc-800/60">
        {hasChildren ? (
          <button
            type="button"
            aria-label={isOpen ? "Contraer" : "Expandir"}
            onClick={() => setOpenMap((m) => ({ ...m, [path]: !isOpen }))}
            className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <span
              className={`inline-block transform transition-transform ${
                isOpen ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
          </button>
        ) : (
          <span className="w-5" />
        )}

        <input
          ref={cbRef}
          id={path}
          type="checkbox"
          className="accent-blue-500"
          checked={isChecked}
          onChange={() => onToggle(node, prefix)}
          title={node.label}
        />
        <label
          htmlFor={path}
          className="cursor-pointer select-none text-sm text-zinc-200"
        >
          {node.label}
        </label>
      </div>

      {hasChildren && (
        <div
          className={`ml-6 border-l border-zinc-700/60 pl-3 overflow-hidden transition-all duration-200 ${
            isOpen ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {node.children!.map((child) => (
            <TreeNodeUI
              key={child.label}
              node={child}
              prefix={path}
              openMap={openMap}
              setOpenMap={setOpenMap}
              checked={checked}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Page;
