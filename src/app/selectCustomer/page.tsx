"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { CgProfile } from "react-icons/cg";
import { FaAddressBook } from "react-icons/fa";
import { CiMenuKebab } from "react-icons/ci";
import { FiMapPin } from "react-icons/fi";
import { AiOutlineDownload } from "react-icons/ai";

// Componentes lazy loading para modales pesados
import { lazy, Suspense } from "react";
const ResetPassword = lazy(() => import("./ResetPassword"));
const UpdateGPS = lazy(() => import("./UpdateGPS"));
const MapModal = lazy(() => import("./MapModal"));
const MapComponent = lazy(() => import("./Map"));

// Hooks de navegación e internacionalización
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMobile } from "../context/ResponsiveContext";
import { useAuth } from "../context/AuthContext";
import { useGetCustomersPagQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import debounce from "../context/debounce";
import { useGetPaymentConditionsQuery } from "@/redux/services/paymentConditionsApi";
import PrivateRoute from "../context/PrivateRoutes";
import Header from "../components/components/Header";
import CustomerListMobile from "./MobileSeller";
import Table from "../components/components/Table";
import Modal from "../components/components/Modal";
import ButtonOnOff from "./ButtonOnOff";
import { useClient } from "../context/ClientContext";

// Función helper optimizada para eliminar duplicados
const removeDuplicates = (array: any[]) => {
  const seen = new Set();
  return array.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

// Constante para el número de elementos por página - reducido para carga inicial más rápida
const ITEMS_PER_PAGE = 10;

const Spinner = React.memo(function Spinner() {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
});
Spinner.displayName = "Spinner";

const SelectCustomer = () => {
  // Hooks de navegación, traducción y contexto
  const router = useRouter();
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const { userData, role } = useAuth();
  const { setSelectedClientId } = useClient();

  // Estados principales - optimizados
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [sortQuery, setSortQuery] = useState("");

  // Memoizar searchParams para evitar re-renders innecesarios
  const [searchParams, setSearchParams] = useState(() => ({
    debt: false,
    overdueDebt: false,
    seller_id:
      role === "VENDEDOR" && userData?.seller_id ? userData.seller_id : "",
    itemsInCart: false,
  }));

  // Estados para modales y selección del cliente actual
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(
    null
  );
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showUpdateGPSModal, setShowUpdateGPSModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showCustomersMapModal, setShowCustomersMapModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  // Referencia para el IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement>(null);

  // Memoizar parámetros de consulta para evitar re-fetches innecesarios
  const queryParams = useMemo(
    () => ({
      page,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      hasDebt: searchParams.debt ? "true" : "",
      hasDebtExpired: searchParams.overdueDebt ? "true" : "",
      seller_id: searchParams.seller_id || "",
      hasArticlesOnSC: searchParams.itemsInCart ? "true" : "",
      sort: sortQuery,
    }),
    [page, searchQuery, searchParams, sortQuery]
  );

  // Consulta principal optimizada
  const {
    data: customersData,
    error,
    isFetching,
  } = useGetCustomersPagQuery(queryParams);

  // Consulta para el mapa solo cuando se necesite
  const { data: allCustomersData, refetch: refetchAllCustomers } =
    useGetCustomersPagQuery(
      {
        page: 1,
        limit: 1000,
        query: searchQuery,
        hasDebt: searchParams.debt ? "true" : "",
        hasDebtExpired: searchParams.overdueDebt ? "true" : "",
        seller_id: searchParams.seller_id || "",
        hasArticlesOnSC: searchParams.itemsInCart ? "true" : "",
        sort: sortQuery,
      },
      {
        skip: !showCustomersMapModal, // Solo fetch cuando se necesite el mapa
      }
    );

  // Consultas para datos auxiliares con caché
  const { data: paymentConditions } = useGetPaymentConditionsQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);

  // Función de búsqueda optimizada con debounce
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setPage(1);
        setItems([]);
        setHasMore(true);
        setSearchQuery(query);
      }, 300), // Reducido a 300ms para respuesta más rápida
    []
  );

  // Handlers optimizados con useCallback
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const handleSelectCustomer = useCallback(
    (customerId: string) => {
      setSelectedClientId(customerId);
      router.push("/dashboard");
    },
    [setSelectedClientId, router]
  );

  const resetSearch = useCallback(() => {
    setInputValue("");
    setSearchQuery("");
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, []);

  // Optimización del infinite scroll
  const setupIntersectionObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // Cargar antes de llegar al final
      }
    );

    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current);
    }
  }, [hasMore, isFetching]);

  // Configurar observer cuando cambie hasMore o isFetching
  useEffect(() => {
    setupIntersectionObserver();
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [setupIntersectionObserver]);

  // Optimizar actualización de items
  useEffect(() => {
    if (customersData?.customers) {
      const newCustomers = customersData.customers;

      if (page === 1) {
        setItems(newCustomers);
      } else {
        setItems((prev) => {
          const combined = [...prev, ...newCustomers];
          return removeDuplicates(combined);
        });
      }

      setHasMore(newCustomers.length === ITEMS_PER_PAGE);
    }
  }, [customersData, page]);

  // Handlers para filtros optimizados
  const resetFilters = useCallback(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, []);

  const createFilterHandler = useCallback(
    (filterName: keyof typeof searchParams) => () => {
      setSearchParams((prev) => ({ ...prev, [filterName]: !prev[filterName] }));
      setFilter((prev) => (prev === filterName ? "" : filterName));
      resetFilters();
    },
    [resetFilters]
  );

  const handleFilterDebt = useMemo(
    () => createFilterHandler("debt"),
    [createFilterHandler]
  );
  const handleFilterOverdueDebt = useMemo(
    () => createFilterHandler("overdueDebt"),
    [createFilterHandler]
  );
  const handleFilterCart = useMemo(
    () => createFilterHandler("itemsInCart"),
    [createFilterHandler]
  );

  // Handler de ordenamiento optimizado
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      const newDirection =
        currentField === field && currentDirection === "asc" ? "desc" : "asc";
      setSortQuery(`${field}:${newDirection}`);
      resetFilters();
    },
    [sortQuery, resetFilters]
  );

  // Handlers de menú optimizados
  const toggleCustomerMenu = useCallback((customerId: any) => {
    setActiveMenu((prev) => (prev === customerId ? null : customerId));
  }, []);

  const handleResetPassword = useCallback((customer: any) => {
    setCurrentCustomerId(customer);
    setShowResetPasswordModal(true);
    setActiveMenu(null);
  }, []);

  const handleUpdateGPS = useCallback((customer: any) => {
    setCurrentCustomerId(customer);
    setShowUpdateGPSModal(true);
    setActiveMenu(null);
  }, []);

  const handleViewLocation = useCallback((customer: any) => {
    setCurrentCustomerId(customer);
    setShowMapModal(true);
  }, []);

  // Componente CustomerIcon memoizado
  const CustomerIcon = React.memo(function CustomerIcon({
    name,
  }: {
    name: string;
  }) {
    return (
      <div className="rounded-full h-8 w-8 bg-secondary text-white flex justify-center items-center">
        <p>{name.charAt(0).toUpperCase()}</p>
      </div>
    );
  });
  CustomerIcon.displayName = "CustomerIcon";

  // Formatear moneda optimizado
    function formatCurrency(value: number) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    })
      .format(value)
      .replace("ARS", "");
  }
  
  // Transformar datos de tabla con memoización optimizada
  const tableData = useMemo(() => {
    return items.map((customer: any) => {
      const paymentCondition =
        paymentConditions?.find(
          (cond) => cond.id === customer.payment_condition_id
        )?.name || "";

      return {
        icon: <CustomerIcon name={customer.name} />,
        id: (
          <span
            onClick={() => handleSelectCustomer(customer.id)}
            className="cursor-pointer hover:text-blue-600"
          >
            {customer.id}
          </span>
        ),
        name: (
          <span
            onClick={() => handleSelectCustomer(customer.id)}
            className="cursor-pointer hover:text-blue-600"
          >
            {customer.name}
          </span>
        ),
        address: <span title={customer.address}>{customer.address}</span>,
        "payment-condition": paymentCondition,
        "status-account": formatCurrency(customer.totalAmount || 0),
        "expired-debt": formatCurrency(customer.totalAmountExpired || 0),
        shopping_cart: customer.shopping_cart?.length || 0,
        gps: customer.gps ? (
          <FiMapPin
            onClick={() => handleViewLocation(customer)}
            className="cursor-pointer hover:text-blue-600"
          />
        ) : (
          "No GPS"
        ),
        menu: (
          <div className="relative">
            <CiMenuKebab
              onClick={() => toggleCustomerMenu(customer.id)}
              className="cursor-pointer hover:text-blue-600"
            />
            {activeMenu === customer.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                <button
                  onClick={() => handleUpdateGPS(customer.id)}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Actualizar GPS
                </button>
                <button
                  onClick={() => handleResetPassword(customer.id)}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Resetear Contraseña
                </button>
              </div>
            )}
          </div>
        ),
      };
    });
  }, [
    items,
    paymentConditions,
    activeMenu,
    handleSelectCustomer,
    formatCurrency,
    handleViewLocation,
    toggleCustomerMenu,
    handleUpdateGPS,
    handleResetPassword,
    CustomerIcon,
  ]);

  // Configuración de encabezados memoizada
  const tableHeader = useMemo(
    () => [
      { component: <CgProfile className="text-center text-xl" />, key: "icon" },
      { name: "Id", key: "id", important: true },
      { name: t("customer"), key: "name", important: true, sortable: true },
      { name: t("address"), key: "address" },
      { name: t("paymentCondition"), key: "payment-condition" },
      { name: t("statusAccount"), key: "status-account", sortable: true },
      { name: t("expiredDebt"), key: "expired-debt", sortable: true },
      { name: t("articlesOnCart"), key: "shopping_cart", sortable: true },
      { name: "GPS", key: "gps", important: true },
      {
        component: <CiMenuKebab className="text-center text-xl" />,
        key: "menu",
        important: true,
      },
    ],
    [t]
  );

  // Header body memoizado
  const headerBody = useMemo(
    () => ({
      buttons: [
        {
          logo: <FiMapPin />,
          title: `${t("viewOnMap")}`,
          onClick: () => {
            setShowCustomersMapModal(true);
            if (!allCustomersData) {
              refetchAllCustomers();
            }
          },
        },
        { logo: <AiOutlineDownload />, title: t("download") },
      ],
      filters: [
        {
          content: (
            <select
              value={searchParams.seller_id}
              onChange={(e) => {
                setSearchParams((prev) => ({
                  ...prev,
                  seller_id: e.target.value,
                }));
                resetFilters();
              }}
              className="border border-gray-300 rounded p-2"
              disabled={role === "VENDEDOR"}
            >
              <option value="">{t("seller")}</option>
              {sellersData?.map((seller) => (
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
                value={inputValue}
                onChange={handleSearchChange}
                className="w-full bg-white rounded-md px-4 py-2 pr-10 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 border"
              />
              <button
                onClick={resetSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                X
              </button>
            </div>
          ),
        },
        {
          content: (
            <ButtonOnOff
              title={t("debt")}
              onChange={handleFilterDebt}
              active={filter === "debt"}
            />
          ),
        },
        {
          content: (
            <ButtonOnOff
              title={t("expiredDebt")}
              onChange={handleFilterOverdueDebt}
              active={filter === "overdueDebt"}
            />
          ),
        },
        {
          content: (
            <ButtonOnOff
              title={t("articlesOnCart")}
              onChange={handleFilterCart}
              active={filter === "itemsInCart"}
            />
          ),
        },
      ],
      results: `${t("results", { count: customersData?.totalCustomers || 0 })}`,
    }),
    [
      searchParams,
      inputValue,
      handleSearchChange,
      resetSearch,
      filter,
      handleFilterDebt,
      handleFilterOverdueDebt,
      handleFilterCart,
      customersData?.totalCustomers,
      t,
      sellersData,
      role,
      resetFilters,
      refetchAllCustomers,
      allCustomersData,
    ]
  );

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}
    >
      <div className={`gap-4 ${isMobile ? "bg-primary" : ""} mt-4`}>
        <h3 className={`text-bold p-2 ${isMobile ? "text-white" : ""}`}>
          {t("selectCustomerTitle")}
        </h3>

        {isMobile ? (
          <div className="bg-zinc-900 p-4 rounded-lg">
            <div className="flex gap-2 mb-4">
              <ButtonOnOff
                title={t("debt")}
                onChange={handleFilterDebt}
                active={filter === "debt"}
              />
              <ButtonOnOff
                title={t("expiredDebt")}
                onChange={handleFilterOverdueDebt}
                active={filter === "overdueDebt"}
              />
              <ButtonOnOff
                title={t("articlesOnCart")}
                onChange={handleFilterCart}
                active={filter === "itemsInCart"}
              />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder={t("search")}
                value={inputValue}
                onChange={handleSearchChange}
                className="w-full bg-white rounded-md px-4 py-2 pr-10 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <button
                onClick={resetSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                X
              </button>
            </div>

            {searchQuery && (
              <div className="mt-2 text-right text-sm text-zinc-400">
                {t("results", { count: customersData?.totalCustomers || 0 })}
              </div>
            )}
          </div>
        ) : (
          <Header headerBody={headerBody} />
        )}

        {error && <div className="error">{t("Error al cargar clientes")}</div>}

        {/* Renderizar contenido según el dispositivo */}
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
          <Table headers={tableHeader} data={tableData} onSort={handleSort} />
        )}

        {/* Div para Infinite Scroll optimizado */}
        <div ref={lastItemRef} style={{ height: "1px" }}></div>

        {/* Spinner de carga */}
        {isFetching && <Spinner />}

        {/* Modales con lazy loading y Suspense */}
        <Suspense fallback={<Spinner />}>
          {showResetPasswordModal && currentCustomerId && (
            <Modal
              isOpen={showResetPasswordModal}
              onClose={() => setShowResetPasswordModal(false)}
            >
              <ResetPassword
                customerId={currentCustomerId}
                closeModal={() => setShowResetPasswordModal(false)}
              />
            </Modal>
          )}

          {showUpdateGPSModal && currentCustomerId && (
            <Modal
              isOpen={showUpdateGPSModal}
              onClose={() => setShowUpdateGPSModal(false)}
            >
              <UpdateGPS
                customerId={currentCustomerId}
                closeModal={() => setShowUpdateGPSModal(false)}
              />
            </Modal>
          )}

          {showMapModal && currentCustomerId && (
            <Modal isOpen={showMapModal} onClose={() => setShowMapModal(false)}>
              <MapComponent
                key={currentCustomerId}
                currentCustomerId={currentCustomerId}
                closeModal={() => setShowMapModal(false)}
              />
            </Modal>
          )}

          {showCustomersMapModal && allCustomersData && (
            <Modal
              isOpen={showCustomersMapModal}
              onClose={() => setShowCustomersMapModal(false)}
            >
              <MapModal
                customers={allCustomersData.customers}
                onClose={() => setShowCustomersMapModal(false)}
              />
            </Modal>
          )}
        </Suspense>
      </div>
    </PrivateRoute>
  );
};

export default SelectCustomer;
