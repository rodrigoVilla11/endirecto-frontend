"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { FaAddressBook } from "react-icons/fa";
import { CiMenuKebab } from "react-icons/ci";
import { FiMapPin } from "react-icons/fi";
import { AiOutlineDownload } from "react-icons/ai";
import Header from "../components/components/Header";
import Table from "../components/components/Table";
import ButtonOnOff from "./ButtonOnOff";
import PrivateRoute from "../context/PrivateRoutes";
import Modal from "../components/components/Modal";
import ResetPassword from "./ResetPassword";
import UpdateGPS from "./UpdateGPS";
import debounce from "../context/debounce";
import { useAuth } from "../context/AuthContext";
import { useMobile } from "../context/ResponsiveContext";
import CustomerListMobile from "./MobileSeller";
import MapComponent from "./Map";
import MapModal from "./MapModal";
import { useGetCustomersPagQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetPaymentConditionsQuery } from "@/redux/services/paymentConditionsApi";
import { useClient } from "../context/ClientContext";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

// Definimos una interfaz para los parámetros de búsqueda
interface SearchParams {
  hasDebt: string;
  hasDebtExpired: string;
  seller_id: string;
  hasArticlesOnSC: string;
}

const ITEMS_PER_PAGE = 15;

const SelectCustomer: React.FC = () => {
  const router = useRouter();
  const { role, userData } = useAuth();
  const { isMobile } = useMobile();
  const { setSelectedClientId } = useClient();
  const { t } = useTranslation();
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Estados principales
  const [page, setPage] = useState<number>(1);
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [sortQuery, setSortQuery] = useState<string>("");
  const [searchParams, setSearchParams] = useState<SearchParams>({
    hasDebt: "",
    hasDebtExpired: "",
    seller_id: role === "VENDEDOR" && userData?.seller_id ? userData.seller_id : "",
    hasArticlesOnSC: "",
  });

  // Estados para modales y selección actual
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [isUpdateGPSModalOpen, setUpdateGPSModalOpen] = useState<boolean>(false);
  const [isViewGPSModalOpen, setViewGPSModalOpen] = useState<boolean>(false);
  const [isViewAllMapModalOpen, setViewAllMapModalOpen] = useState<boolean>(false);

  // Objeto de parámetros para la consulta memorizado
  const queryParams = useMemo(
    () => ({
      page,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      hasDebtExpired: searchParams.hasDebtExpired,
      hasDebt: searchParams.hasDebt,
      seller_id: searchParams.seller_id,
      hasArticlesOnSC: searchParams.hasArticlesOnSC,
      sort: sortQuery,
    }),
    [page, searchQuery, searchParams, sortQuery]
  );

  // Consultas a la API
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetCustomersPagQuery(queryParams, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const { data: allCustomersData } = useGetCustomersPagQuery(
    {
      ...queryParams,
      page: 1,
      limit: 1000, // Para obtener todos los clientes para la vista de mapa
    },
    {
      refetchOnMountOrArgChange: false,
      skip: !isViewAllMapModalOpen, // Solo se consulta cuando el modal del mapa está abierto
    }
  );

  const { data: paymentsConditionsData } = useGetPaymentConditionsQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);

  const markersCustomers = allCustomersData?.customers || [];

  // Búsqueda con debounce
  const resetList = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, []);
  

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      resetList();
    }, 300),
    [resetList]
  );

  const handleResetSearch = useCallback(() => {
    setSearchQuery("");
    resetList();
  }, [resetList]);

  // Actualizar la lista de ítems cuando llegan datos nuevos
  useEffect(() => {
    if (data?.customers) {
      setItems((prev) => {
        if (page === 1) {
          return data.customers;
        }
        // Filtrar duplicados al agregar nuevos elementos
        const existingIds = new Set(prev.map((item) => item.id));
        const newItems = data.customers.filter((item: any) => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
      setHasMore(data.customers.length === ITEMS_PER_PAGE);
    }
  }, [data?.customers, page]);

  // Reiniciar y refetchear cuando cambia seller_id
  useEffect(() => {
    if (searchParams.seller_id !== undefined) {
      resetList();
      refetch();
    }
  }, [searchParams.seller_id, refetch, resetList]);

  // Implementación del Infinite Scroll
  const lastArticleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isQueryLoading) {
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.1, rootMargin: "200px" }
      );

      if (node) observerRef.current.observe(node);
    },
    [hasMore, isQueryLoading]
  );

  // Manejadores para filtros y ordenamiento
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      const newDirection =
        currentField === field && currentDirection === "asc" ? "desc" : "asc";
      setSortQuery(`${field}:${newDirection}`);
      resetList();
    },
    [sortQuery, resetList]
  );

  // Función para alternar los filtros
  const toggleFilter = useCallback(
    (filterName: keyof SearchParams) => {
      setSearchParams((prev) => ({
        ...prev,
        [filterName]: prev[filterName] === "true" ? "" : "true",
      }));
      resetList();
    },
    [resetList]
  );

  // Manejadores para menú y selección
  const toggleMenu = useCallback((customerId: string) => {
    setActiveMenu((prev) => (prev === customerId ? null : customerId));
  }, []);

  const handleSelectCustomer = useCallback((customerId: string) => {
    setSelectedClientId(customerId);
    router.push(role === "VENDEDOR" ? "/orders/orderSeller" : "/dashboard");
  }, [setSelectedClientId, router, role]);

  // Manejadores de modal con currying
  const handleModal = useCallback(
    (
      modalSetter: React.Dispatch<React.SetStateAction<boolean>>,
      idSetter?: React.Dispatch<React.SetStateAction<string | null>>
    ) => (id: string | null = null) => {
      if (idSetter) idSetter(id);
      modalSetter((prev) => !prev);
    },
    []
  );

  const openUpdateModal = handleModal(setUpdateModalOpen, setCurrentCustomerId);
  const closeUpdateModal = handleModal(setUpdateModalOpen);
  const openUpdateGPSModal = handleModal(setUpdateGPSModalOpen, setCurrentCustomerId);
  const closeUpdateGPSModal = handleModal(setUpdateGPSModalOpen);
  const openViewGPSModal = handleModal(setViewGPSModalOpen, setCurrentCustomerId);
  const closeViewGPSModal = handleModal(setViewGPSModalOpen);
  const toggleMapModal = handleModal(setViewAllMapModalOpen);

  // Preparación de datos para la tabla
  const tableData = useMemo(() => {
    if (!items.length) return [];
    // Eliminar duplicados
    const uniqueItems: any[] = [];
    const seen = new Set();
    for (const customer of items) {
      if (!seen.has(customer.id)) {
        seen.add(customer.id);
        uniqueItems.push(customer);
      }
    }
    return uniqueItems.map((customer: any) => {
      const paymentCondition = paymentsConditionsData?.find(
        (data: any) => data.id === customer.payment_condition_id
      );
      return {
        key: customer.id,
        icon: (
          <div className="rounded-full h-8 w-8 bg-secondary text-white flex justify-center items-center">
            <p>{customer.name.charAt(0).toUpperCase()}</p>
          </div>
        ),
        "customer-id": customer.id,
        id: (
          <span
            onClick={() => handleSelectCustomer(customer.id)}
            className="hover:cursor-pointer"
          >
            {customer.id}
          </span>
        ),
        customer: (
          <span
            onClick={() => handleSelectCustomer(customer.id)}
            className="hover:cursor-pointer"
          >
            {customer.name}
          </span>
        ),
        address: (
          <div className="relative group">
            <span>
              <FaAddressBook className="text-center text-xl" />
            </span>
            <div className="absolute w-56 left-full bottom-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
              {customer.address}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
            </div>
          </div>
        ),
        "payment-condition": paymentCondition?.name || "NOT FOUND",
        "status-account": (
          <div className="text-end">
            {new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "ARS",
              minimumFractionDigits: 2,
            }).format(customer.totalAmount)}
          </div>
        ),
        "expired-debt": (
          <div className="text-end text-red-600">
            {new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "ARS",
              minimumFractionDigits: 2,
            }).format(customer.totalAmountExpired)}
          </div>
        ),
        "articles-on-cart": customer.shopping_cart.length,
        gps: (
          <FiMapPin
            onClick={() => openViewGPSModal(customer.id)}
            className="text-center font-bold text-3xl text-white hover:cursor-pointer hover:text-black bg-green-400 p-1.5 rounded-sm"
          />
        ),
        menu: (
          <div className="relative">
            <CiMenuKebab
              className="text-center text-xl cursor-pointer"
              onClick={() => toggleMenu(customer.id)}
            />
            {activeMenu === customer.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                <button
                  onClick={() => openUpdateGPSModal(customer.id)}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Actualizar GPS
                </button>
                <button
                  onClick={() => openUpdateModal(customer.id)}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Resetear contraseña
                </button>
              </div>
            )}
          </div>
        ),
      };
    });
  }, [
    items,
    paymentsConditionsData,
    activeMenu,
    handleSelectCustomer,
    openUpdateGPSModal,
    openUpdateModal,
    toggleMenu,
    openViewGPSModal,
  ]);

  // Definición del encabezado de la tabla
  const tableHeader = useMemo(
    () => [
      { component: <CgProfile className="text-center text-xl" />, key: "icon" },
      { name: "Id", key: "id", important: true },
      { name: t("customer"), key: "customer", important: true, sortable: true },
      { name: t("address"), key: "address" },
      { name: t("paymentCondition"), key: "payment-condition" },
      { name: t("statusAccount"), key: "status-account", sortable: true },
      { name: t("expiredDebt"), key: "expired-debt", sortable: true },
      { name: t("articlesOnCart"), key: "articles-on-cart", sortable: true },
      { name: "GPS", key: "gps", important: true },
      { component: <CiMenuKebab className="text-center text-xl" />, key: "menu", important: true },
    ],
    [t]
  );

  // Configuración del encabezado
  const headerBody = useMemo(
    () => ({
      buttons: [
        {
          logo: <FiMapPin />,
          title: t("viewOnMap"),
          onClick: toggleMapModal,
        },
        { logo: <AiOutlineDownload />, title: t("download") },
      ],
      filters: [
        {
          content: (
            <select
              value={searchParams.seller_id}
              onChange={(e) => {
                setSearchParams({ ...searchParams, seller_id: e.target.value });
                resetList();
              }}
              className="border border-gray-300 rounded p-2"
              disabled={role === "VENDEDOR"}
            >
              <option value="">{t("seller")}</option>
              {sellersData?.map((seller: any) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
          ),
        },
        {
          content: (
            <div className="relative">
              <input
                type="text"
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="w-full bg-white rounded-md px-4 py-2 pr-10 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 border"
              />
              {searchQuery && (
                <button
                  onClick={handleResetSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              )}
            </div>
          ),
        },
        {
          content: (
            <ButtonOnOff
              title={t("debt")}
              onChange={() => toggleFilter("hasDebt")}
              active={searchParams.hasDebt === "true"}
            />
          ),
        },
        {
          content: (
            <ButtonOnOff
              title={t("expiredDebt")}
              onChange={() => toggleFilter("hasDebtExpired")}
              active={searchParams.hasDebtExpired === "true"}
            />
          ),
        },
        {
          content: (
            <ButtonOnOff
              title={t("articlesOnCart")}
              onChange={() => toggleFilter("hasArticlesOnSC")}
              active={searchParams.hasArticlesOnSC === "true"}
            />
          ),
        },
      ],
      results: t("results", { count: data?.totalCustomers || 0 }),
    }),
    [
      searchQuery,
      searchParams,
      data?.totalCustomers,
      debouncedSearch,
      handleResetSearch,
      toggleFilter,
      resetList,
      sellersData,
      role,
      t,
      toggleMapModal,
    ]
  );

  if (isQueryLoading && items.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading customers. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}>
      <div className={`gap-4 ${isMobile ? "bg-primary" : ""}`}>
        <h3 className={`text-bold p-2 ${isMobile ? "text-white" : ""}`}>
          {t("selectCustomerTitle")}
        </h3>

        {isMobile ? (
          <div className="bg-zinc-900 p-4 rounded-lg">
            <div className="flex gap-2 mb-4">
              <ButtonOnOff
                title={t("debt")}
                onChange={() => toggleFilter("hasDebt")}
                active={searchParams.hasDebt === "true"}
              />
              <ButtonOnOff
                title={t("expiredDebt")}
                onChange={() => toggleFilter("hasDebtExpired")}
                active={searchParams.hasDebtExpired === "true"}
              />
              <ButtonOnOff
                title={t("articlesOnCart")}
                onChange={() => toggleFilter("hasArticlesOnSC")}
                active={searchParams.hasArticlesOnSC === "true"}
              />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="w-full bg-white rounded-md px-4 py-2 pr-10 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              {searchQuery && (
                <button
                  onClick={handleResetSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="mt-2 text-right text-sm text-zinc-400">
                {t("results", { count: data?.totalCustomers || 0 })}
              </div>
            )}
          </div>
        ) : (
          <Header headerBody={headerBody} />
        )}

        {isMobile ? (
          <CustomerListMobile
            filteredItems={items.map((customer: any) => ({
              id: customer.id,
              name: customer.name,
              address: customer.address,
              totalAmount: customer.totalAmount,
              totalAmountExpired: customer.totalAmountExpired,
              shopping_cart: customer.shopping_cart,
            }))}
            handleSelectCustomer={handleSelectCustomer}
          />
        ) : (
          <Table
            key={`${searchQuery}-${JSON.stringify(searchParams)}-${sortQuery}`}
            headers={tableHeader}
            data={tableData}
            onSort={handleSort}
            sortField={sortQuery.split(":")[0]}
            sortOrder={(sortQuery.split(":")[1] as "asc" | "desc") || ""}
          />
        )}

        <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
          {currentCustomerId && (
            <ResetPassword customerId={currentCustomerId} closeModal={closeUpdateModal} />
          )}
        </Modal>

        <Modal isOpen={isUpdateGPSModalOpen} onClose={closeUpdateGPSModal}>
          {currentCustomerId && (
            <UpdateGPS customerId={currentCustomerId} closeModal={closeUpdateGPSModal} />
          )}
        </Modal>

        {isViewGPSModalOpen && currentCustomerId && (
          <Modal isOpen={isViewGPSModalOpen} onClose={closeViewGPSModal}>
            <MapComponent
              key={currentCustomerId} // Se utiliza un key estable para evitar remounts innecesarios
              currentCustomerId={currentCustomerId}
              closeModal={closeViewGPSModal}
            />
          </Modal>
        )}

        {isViewAllMapModalOpen && (
          <Modal isOpen={isViewAllMapModalOpen} onClose={toggleMapModal}>
            <MapModal customers={markersCustomers} onClose={toggleMapModal} />
          </Modal>
        )}

        {/* Elemento sentinel para el infinite scroll */}
        <div ref={lastArticleRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default SelectCustomer;
