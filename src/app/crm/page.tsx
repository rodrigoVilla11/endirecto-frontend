"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { IoMdPin } from "react-icons/io";
import { FaInfoCircle, FaPlus } from "react-icons/fa";
import DatePicker from "react-datepicker";
import { format, startOfDay, endOfDay } from "date-fns";
import { useGetCrmPagQuery } from "@/redux/services/crmApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import PrivateRoute from "../context/PrivateRoutes";
import Modal from "../components/components/Modal";
import CreateCRMComponent from "./CreateCRM";
import { useClient } from "../context/ClientContext";
import { useTranslation } from "react-i18next";
import debounce from "../context/debounce";
import { FiMapPin } from "react-icons/fi";
import MapComponent from "./Map";
import CRMDetail from "./CRMDetail";
import { useGetOrdersQuery } from "@/redux/services/ordersApi";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // ---------- Estados para la paginación y datos ----------
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ---------- Estados para los filtros ----------
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sellerFilter, setSellerFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>("");
  const [isViewGPSModalOpen, setViewGPSModalOpen] = useState(false);
  const [currentGPS, setCurrentGPS] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    type: "update" | "delete" | "info" | null;
    crm: any | null;
  }>({ type: null, crm: null });

  // ---------- Estados y lógica para modal de creación ----------
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const openCreateModal = useCallback(() => setCreateModalOpen(true), []);
  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    refetch();
  }, []);

  // ---------- Context y data adicional ----------
  const { selectedClientId } = useClient();
  const [customer_id, setCustomer_id] = useState("");

  // ---------- Queries para datos relacionados ----------
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data: ordersData } = useGetOrdersQuery(null);

  // ---------- Query principal para CRM ----------
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
    isFetching,
  } = useGetCrmPagQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      startDate: startDate ? startOfDay(startDate).toISOString() : undefined,
      endDate: endDate ? endOfDay(endDate).toISOString() : undefined,
      type: typeFilter,
      insitu: "",
      customer_id,
      seller_id: sellerFilter,
      search: searchQuery,
      sort: sortQuery,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  // ---------- Actualiza el customer_id al cambiar selectedClientId ----------
  useEffect(() => {
    if (selectedClientId !== undefined) {
      setCustomer_id(selectedClientId || "");
      setPage(1);
      setItems([]);
      setHasMore(true);
    }
  }, [selectedClientId]);

  // ---------- Manejo de la carga inicial y actualización de datos ----------
  useEffect(() => {
    if (!isFetching && data?.crms) {
      if (page === 1) {
        setItems(data.crms);
      } else {
        setItems((prevItems) => [...prevItems, ...data.crms]);
      }
      setHasMore(data.crms.length === ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }
  }, [data, isFetching, page]);

  // ---------- Función para resetear la paginación y filtros ----------
  const resetPagination = useCallback(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, []);

  // ---------- Debounce para la búsqueda ----------
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
      resetPagination();
    }, 500),
    [resetPagination]
  );

  // ---------- IntersectionObserver para scroll infinito ----------
  const observerRef = useRef<HTMLDivElement | null>(null);

  const openViewGPSModal = (gps: string) => {
    setCurrentGPS(gps);
    setViewGPSModalOpen(true);
  };
  const closeViewGPSModal = () => {
    setViewGPSModalOpen(false);
    setCurrentGPS(null);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (
          firstEntry.isIntersecting &&
          hasMore &&
          !isFetching &&
          !isLoadingMore
        ) {
          setIsLoadingMore(true);
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
  }, [hasMore, isFetching, isLoadingMore]);

  // ---------- Manejo de ordenamiento ----------
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

  // ---------- Funciones para manejar cambios de filtros ----------
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

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch]
  );

  const handleModalOpen = useCallback(
    (type: "update" | "delete" | "info", crm: any) => {
      setModalState({ type, crm: crm });
    },
    []
  );
  const handleModalClose = useCallback(
    async (type: "update" | "delete" | "info") => {
      setModalState({ type: null, crm: null });
      setTimeout(async () => {
        try {
          await refetch();
        } catch (error) {
          console.error(t("errorRefetchingData"), error);
        }
      }, 100);
    },
    [refetch, t]
  );
  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // ---------- Memoización del mapeo de datos para la tabla ----------
  const tableData = React.useMemo(
    () =>
      items?.map((crm) => {
        const customer = customersData?.find(
          (data) => data.id === crm.customer_id
        );
        const seller = sellersData?.find((data) => data.id === crm.seller_id);
        const order = ordersData?.find((data) => data.tmp_id === crm.order_id);

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
          seller: seller?.name || t("notAvailable"),
          customer: customer?.name || t("notAvailable"),
          user: crm.user_id || t("notAvailable"),
          date: crm.date
            ? format(new Date(crm.date), "yyyy-MM-dd HH:mm")
            : t("notAvailable"),
          type: crm.type || t("notAvailable"),
          number: order?.multisoft_id || t("notAvailable"),
          amount: formatCurrency(order?.total) || t("notAvailable"),
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
    [items, customersData, sellersData, ordersData, t]
  );

  // ---------- Definición de columnas ----------
  const tableHeader = React.useMemo(
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

  // ---------- Filtros en la cabecera (Header) ----------
  const headerBody = React.useMemo(
    () => ({
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
              onChange={handleDateChange(setStartDate)}
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
              onChange={handleDateChange(setEndDate)}
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
              onChange={handleFilterChange(setSellerFilter)}
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
        {
          content: (
            <select
              value={typeFilter}
              onChange={handleFilterChange(setTypeFilter)}
              className="border border-gray-300 rounded p-2"
            >
              <option value="">{t("type")}</option>
              <option value="VISIT">VISIT</option>
              <option value="ORDER">ORDER</option>
              <option value="RECLAIM">RECLAIM</option>
            </select>
          ),
        },
        {
          content: (
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              defaultValue={searchQuery}
              onChange={handleSearchChange}
              className="border border-gray-300 rounded p-2"
              style={{ width: "120px" }}
            />
          ),
        },
      ],
      results: `${data?.total || 0} ${t("results")}`,
    }),
    [
      t,
      startDate,
      endDate,
      sellerFilter,
      typeFilter,
      searchQuery,
      data?.total,
      sellersData,
      openCreateModal,
      handleDateChange,
      handleFilterChange,
      handleSearchChange,
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
        <h3 className="font-bold p-4">{t("crm")}</h3>
        <Header headerBody={headerBody} />
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
        {isLoadingMore && (
          <div className="text-center py-2">{t("loadingMore")}</div>
        )}
      </div>

      {/* Intersection Observer div */}
      <div ref={observerRef} className="h-10" />

      {/* Modal de creación */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateCRMComponent closeModal={closeCreateModal} />
      </Modal>

      {isViewGPSModalOpen && currentGPS && (
        <Modal isOpen={isViewGPSModalOpen} onClose={closeViewGPSModal}>
          <MapComponent
            currentGPS={currentGPS}
            closeModal={closeViewGPSModal}
          />
        </Modal>
      )}

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

export default Page;
