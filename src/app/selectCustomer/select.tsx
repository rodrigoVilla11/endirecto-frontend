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
  const { userData } = useAuth();

  // Estados principales
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sortQuery, setSortQuery] = useState("");
  const [searchParams, setSearchParams] = useState({
    debt: false,
    overdueDebt: false,
    seller: "",
    itemsInCart: false,
  });

  // Estados para modales y selección del cliente actual
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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
    seller_id: searchParams.seller || "",
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
    seller_id: searchParams.seller || "",
    hasArticlesOnSC: searchParams.itemsInCart ? "true" : "",
    sort: sortQuery,
  });

  // Consultas para condiciones de pago y vendedores
  const { data: paymentConditions } = useGetPaymentConditionsQuery(null);
  const { data: sellers } = useGetSellersQuery(null);

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
  const handleSearchChange = (e: any) => {
    debouncedSearch(e.target.value);
  };

  // Botón para resetear la búsqueda
  const resetSearch = () => {
    setSearchQuery("");
    setItems([]);
    setPage(1);
    setHasMore(true);
  };

  // Efecto para actualizar la lista de clientes cuando llegan nuevos datos
  useEffect(() => {
    if (customersData && customersData.customers) {
      const newItems = removeDuplicates([...items, ...customersData.customers]);
      setItems(newItems);
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
  };

  const handleFilterOverdueDebt = () => {
    setSearchParams((prev) => ({ ...prev, overdueDebt: !prev.overdueDebt }));
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

  const handleFilterCart = () => {
    setSearchParams((prev) => ({ ...prev, itemsInCart: !prev.itemsInCart }));
    setPage(1);
    setItems([]);
    setHasMore(true);
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
    setSelectedCustomer(customer);
    setShowResetPasswordModal(true);
    setActiveMenu(null);
  };

  const handleUpdateGPS = (customer: any) => {
    setSelectedCustomer(customer);
    setShowUpdateGPSModal(true);
    setActiveMenu(null);
  };

  const handleViewLocation = (customer: any) => {
    setSelectedCustomer(customer);
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
        icon: <CgProfile title={firstLetter} />,
        id: (
          <span
            onClick={() => setSelectedCustomer(customer)}
            style={{ cursor: "pointer" }}
          >
            {customer.id}
          </span>
        ),
        customer: (
          <span
            onClick={() => setSelectedCustomer(customer)}
            style={{ cursor: "pointer" }}
          >
            {customer.name}
          </span>
        ),
        address: <span title={customer.address}>{customer.address}</span>,
        paymentCondition,
        accountAmount: new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: "EUR",
        }).format(customer.accountAmount || 0),
        overdueDebt: new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: "EUR",
        }).format(customer.overdueDebt || 0),
        cartItems: customer.shopping_cart?.length || 0,
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
              <div className="menu-options">
                <button onClick={() => handleUpdateGPS(customer)}>
                  Actualizar GPS
                </button>
                <button onClick={() => handleResetPassword(customer)}>
                  Resetear Contraseña
                </button>
              </div>
            )}
          </div>
        ),
      };
    });
  }, [items, paymentConditions, activeMenu]);

  // Configuración de encabezados de la tabla y filtros
  const tableHeaders = useMemo(
    () => [
      { label: "", key: "icon" },
      { label: t("ID"), key: "id", sortable: true },
      { label: t("Cliente"), key: "customer", sortable: true },
      { label: t("Dirección"), key: "address" },
      { label: t("Condición de Pago"), key: "paymentCondition" },
      { label: t("Cuenta"), key: "accountAmount", sortable: true },
      { label: t("Deuda Vencida"), key: "overdueDebt", sortable: true },
      { label: t("Artículos en Carrito"), key: "cartItems", sortable: true },
      { label: t("GPS"), key: "gps" },
      { label: "", key: "menu" },
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
        { logo: <AiOutlineDownload />, title: `${t("download")}` },
      ],
      filters: [
        // {
        //   content: (
        //     <select
        //       value={searchParams.seller_id}
        //       onChange={(e) =>
        //         setSearchParams({ ...searchParams, seller_id: e.target.value })
        //       }
        //       className="border border-gray-300 rounded p-2"
        //       disabled={role === "VENDEDOR"}
        //     >
        //       <option value="">{t("seller")}</option>
        //       {sellersData?.map((seller) => (
        //         <option key={seller.id} value={seller.id}>
        //           {seller.name}
        //         </option>
        //       ))}
        //     </select>
        //   ),
        // },
        {
          content: (
            <>
              <input
                type="text"
                placeholder={t("Buscar cliente...")}
                onChange={handleSearchChange}
              />
              <button onClick={resetSearch}>{t("Resetear búsqueda")}</button>
            </>
          ),
        },
        {
          content: (
            <button onClick={handleFilterDebt}>{t("Filtrar por Deuda")}</button>
          ),
        },
        {
          content: (
            <button onClick={handleFilterOverdueDebt}>
              {t("Filtrar por Deuda Vencida")}
            </button>
          ),
        },
        {
          content: (
            <button onClick={handleFilterCart}>
              {t("Filtrar Artículos en Carrito")}
            </button>
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
        <div className="search-and-filters"></div>
        {isFetching || isLoading ? (
          <div className="spinner">{t("Cargando...")}</div>
        ) : error ? (
          <div className="error">{t("Error al cargar clientes")}</div>
        ) : (
          <>
            {isMobile ? (
              <CustomerListMobile customers={items} />
            ) : (
              <Table
                headers={tableHeaders}
                data={tableData}
                onSort={handleSort}
              />
            )}
            {/* Div para Infinite Scroll */}
            <div ref={lastArticleRef}></div>
          </>
        )}

        {/* Modal para resetear la contraseña */}
        {showResetPasswordModal && selectedCustomer && (
          <Modal onClose={() => setShowResetPasswordModal(false)}>
            <ResetPassword
              customerId={selectedCustomer}
              closeModal={() => setShowResetPasswordModal(false)}
            />
          </Modal>
        )}

        {/* Modal para actualizar el GPS */}
        {showUpdateGPSModal && selectedCustomer && (
          <Modal onClose={() => setShowUpdateGPSModal(false)}>
            <UpdateGPS
              customerId={selectedCustomer}
              closeModal={() => setShowUpdateGPSModal(false)}
            />
          </Modal>
        )}

        {/* Modal para ver la ubicación en el GPS */}
        {showMapModal && selectedCustomer && (
          <Modal onClose={() => setShowMapModal(false)}>
            <MapComponent
              key={`${selectedCustomer}-${Date.now()}`}
              currentCustomerId={selectedCustomer}
              closeModal={() => setShowMapModal(false)}
            />
          </Modal>
        )}

        {/* Modal para ver todos los clientes en el mapa */}
        {showCustomersMapModal && allCustomersData && (
          <Modal onClose={() => setShowCustomersMapModal(false)}>
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
