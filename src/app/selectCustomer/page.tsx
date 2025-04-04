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

// Componentes y contextos personalizados
import ResetPassword from "./ResetPassword";
import UpdateGPS from "./UpdateGPS";
import MapModal from "./MapModal";

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
import MapComponent from "./Map";
import ButtonOnOff from "./ButtonOnOff";
import { useClient } from "../context/ClientContext";

// Función debounce importada desde un archivo local

// Función helper para eliminar duplicados basado en la propiedad "id"
function removeDuplicates(array: any[]) {
  const unique: Record<string, boolean> = {};
  return array.filter((item: any) => {
    if (unique[item.id]) {
      return false;
    }
    unique[item.id] = true;
    return true;
  });
}

// Constante para el número de elementos por página
const ITEMS_PER_PAGE = 15;

const SelectCustomer = () => {
  // Hooks de navegación, traducción y contexto
  const router = useRouter();
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const { userData, role } = useAuth();
  const { setSelectedClientId } = useClient();

  // Estados principales
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);

  const [filter, setFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sortQuery, setSortQuery] = useState("");
  const [searchParams, setSearchParams] = useState({
    debt: false,
    overdueDebt: false,
    seller_id: role === "VENDEDOR" && userData?.seller_id ? userData.seller_id : "",
    itemsInCart: false,
  });

  // Estados para modales y selección del cliente actual
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(
    null
  );
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showUpdateGPSModal, setShowUpdateGPSModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showCustomersMapModal, setShowCustomersMapModal] = useState(false);

  // Estado para el menú de opciones de cada cliente
  const [activeMenu, setActiveMenu] = useState(null);

  // Referencia para el IntersectionObserver (Infinite Scroll)
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Consulta a la API para obtener clientes paginados
  const {
    data: customersData,
    error,
    isFetching,
  } = useGetCustomersPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    hasDebt: searchParams.debt ? "true" : "",
    hasDebtExpired: searchParams.overdueDebt ? "true" : "",
    seller_id: searchParams.seller_id || "",
    hasArticlesOnSC: searchParams.itemsInCart ? "true" : "",
    sort: sortQuery,
  });

  // Consulta para obtener todos los clientes (para el mapa) con límite alto
  const { data: allCustomersData } = useGetCustomersPagQuery({
    page: 1,
    limit: 1000,
    query: searchQuery,
    hasDebt: searchParams.debt ? "true" : "",
    hasDebtExpired: searchParams.overdueDebt ? "true" : "",
    seller_id: searchParams.seller_id || "",
    hasArticlesOnSC: searchParams.itemsInCart ? "true" : "",
    sort: sortQuery,
  });

  // Consultas para condiciones de pago y vendedores
  const { data: paymentConditions } = useGetPaymentConditionsQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);

  // Función de búsqueda con debounce para actualizar la consulta
  const debouncedSearch = useCallback(
    debounce((query) => {
      setPage(1);
      setItems([]);
      setHasMore(true);
      setSearchQuery(query);
    }, 500),
    []
  );

  // Manejo del cambio en el input de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    debouncedSearch(e.target.value); 
  };

  const handleSelectCustomer = useCallback(
    (customerId: string) => {
      setSelectedClientId(customerId);
      router.push(role === "VENDEDOR" ? "/orders/orderSeller" : "/dashboard");
    },
    [setSelectedClientId, router, role]
  );

  // Botón para resetear la búsqueda
  const resetSearch = () => {
    setInputValue(""); // Se borra el input de inmediato
    setSearchQuery("");
    setItems([]);
    setPage(1);
    setHasMore(true);
  };

  useEffect(() => {
    if (customersData && customersData.customers) {
      setItems((prevItems) =>
        removeDuplicates([...prevItems, ...customersData.customers])
      );
      if (customersData.customers.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }
    }
  }, [customersData]);

  // Callback para gestionar el Infinite Scroll con IntersectionObserver
  const lastArticleRef = useCallback(
    (node: any) => {
      if (isFetching) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetching, hasMore]
  );

  // Handlers para aplicar filtros
  const handleFilterDebt = () => {
    setSearchParams((prev) => ({ ...prev, debt: !prev.debt }));
    setPage(1);
    setItems([]);
    setHasMore(true);
    setFilter((prevFilter) => (prevFilter === "debt" ? "" : "debt"));
  };

  const handleFilterOverdueDebt = () => {
    setSearchParams((prev) => ({ ...prev, overdueDebt: !prev.overdueDebt }));
    setPage(1);
    setItems([]);
    setHasMore(true);
    setFilter((prevFilter) =>
      prevFilter === "overdueDebt" ? "" : "overdueDebt"
    );
  };

  const handleFilterCart = () => {
    setSearchParams((prev) => ({ ...prev, itemsInCart: !prev.itemsInCart }));
    setPage(1);
    setItems([]);
    setHasMore(true);
    setFilter((prevFilter) =>
      prevFilter === "itemsInCart" ? "" : "itemsInCart"
    );
  };

  // Handler para cambiar el orden de la consulta al hacer clic en un encabezado
  const handleSort = (field: any) => {
    let newSort = field;
    if (sortQuery === field) {
      newSort = `-${field}`;
    }
    setSortQuery(newSort);
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

  // Función para alternar el menú de opciones de un cliente
  const toggleCustomerMenu = (customerId: any) => {
    setActiveMenu((prev) => (prev === customerId ? null : customerId));
  };

  // Handlers para ejecutar acciones desde el menú de cada cliente
  const handleResetPassword = (customer: any) => {
    setCurrentCustomerId(customer);
    setShowResetPasswordModal(true);
    setActiveMenu(null);
  };

  const handleUpdateGPS = (customer: any) => {
    setCurrentCustomerId(customer);
    setShowUpdateGPSModal(true);
    setActiveMenu(null);
  };

  const handleViewLocation = (customer: any) => {
    setCurrentCustomerId(customer);
    setShowMapModal(true);
  };

  // Transformar la lista de clientes al formato requerido por el componente Table
  const tableData = useMemo(() => {
    return items.map((customer: any) => {
      const firstLetter = customer.name ? customer.name.charAt(0) : "";
      const paymentCondition =
        paymentConditions?.find(
          (cond) => cond.id === customer.payment_condition_id
        )?.name || "";
      return {
        icon: (
          <div className="rounded-full h-8 w-8 bg-secondary text-white flex justify-center items-center">
            <p>{customer.name.charAt(0).toUpperCase()}</p>
          </div>
        ),
        id: (
          <span
            onClick={() => handleSelectCustomer(customer.id)}
            style={{ cursor: "pointer" }}
          >
            {customer.id}
          </span>
        ),
        customer: (
          <span
            onClick={() => handleSelectCustomer(customer.id)}
            style={{ cursor: "pointer" }}
          >
            {customer.name}
          </span>
        ),
        address: <span title={customer.address}>{customer.address}</span>,
        "payment-condition": paymentCondition,
        "status-account": new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: "EUR",
        }).format(customer.totalAmount || 0),
        "expired-debt": new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: "EUR",
        }).format(customer.totalAmountExpired || 0),
        "articles-on-cart": customer.shopping_cart?.length || 0,
        gps: (
          <FiMapPin
            onClick={() => handleViewLocation(customer)}
            style={{ cursor: "pointer" }}
          />
        ),
        menu: (
          <div>
            <CiMenuKebab
              onClick={() => toggleCustomerMenu(customer.id)}
              style={{ cursor: "pointer" }}
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
  }, [items, paymentConditions, activeMenu, handleSelectCustomer]);

  // Configuración de encabezados de la tabla y filtros
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
  const headerBody = useMemo(
    () => ({
      buttons: [
        {
          logo: <FiMapPin />,
          title: `${t("viewOnMap")}`,
          onClick: () => setShowCustomersMapModal(true),
        },
        { logo: <AiOutlineDownload />, title: t("download") },
      ],
      filters: [
        {
          content: (
            <select
            value={searchParams.seller_id}
            onChange={(e) => {
              setSearchParams((prev) => ({ ...prev, seller_id: e.target.value }));
              setPage(1);
              setItems([]);
              setHasMore(true);
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
            // <button onClick={handleFilterDebt}>{t("Filtrar por Deuda")}</button>
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
      searchQuery,
      customersData?.totalCustomers,
      debouncedSearch,
      handleResetPassword,
      searchParams,
    ]
  );

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}
    >
      <div className="select-customer">
        <h3 className={`text-bold p-2 ${isMobile ? "text-white" : ""}`}>
          {t("selectCustomerTitle")}
        </h3>
        <Header headerBody={headerBody} />
        {error && <div className="error">{t("Error al cargar clientes")}</div>}

        {/* Renderizar contenido según el dispositivo */}
        {isMobile ? (
          <CustomerListMobile
            customers={items}
            handleSelectCustomer={handleSelectCustomer}
          />
        ) : (
          <Table headers={tableHeader} data={tableData} onSort={handleSort} />
        )}

        {/* Div para Infinite Scroll */}
        <div ref={lastArticleRef}></div>

        {/* Spinner de carga mostrado al final */}
        {(isFetching || isLoading) && (
          <div className="spinner">{t("Cargando...")}</div>
        )}

        {/* Modal para resetear la contraseña */}
        {showResetPasswordModal && currentCustomerId && (
          <Modal isOpen={showResetPasswordModal} onClose={() => setShowResetPasswordModal(false)}>
            <ResetPassword
              customerId={currentCustomerId}
              closeModal={() => setShowResetPasswordModal(false)}
            />
          </Modal>
        )}

        {/* Modal para actualizar el GPS */}
        {showUpdateGPSModal && currentCustomerId && (
          <Modal isOpen={showUpdateGPSModal} onClose={() => setShowUpdateGPSModal(false)}>
            <UpdateGPS
              customerId={currentCustomerId}
              closeModal={() => setShowUpdateGPSModal(false)}
            />
          </Modal>
        )}

        {/* Modal para ver la ubicación en el GPS */}
        {showMapModal && currentCustomerId && (
          <Modal isOpen={showMapModal} onClose={() => setShowMapModal(false)}>
            <MapComponent
              key={currentCustomerId} // Se utiliza un key estable para evitar remounts innecesarios
              currentCustomerId={currentCustomerId}
              closeModal={() => setShowMapModal(false)}
            />
          </Modal>
        )}

        {/* Modal para ver todos los clientes en el mapa */}
        {showCustomersMapModal && allCustomersData && (
          <Modal isOpen={showCustomersMapModal} onClose={() => setShowCustomersMapModal(false)}>
            <MapModal
              customers={allCustomersData.customers}
              onClose={() => setShowCustomersMapModal(false)}
            />
          </Modal>
        )}
      </div>
    </PrivateRoute>
  );
};

export default SelectCustomer;
