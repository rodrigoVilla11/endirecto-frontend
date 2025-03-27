"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CgProfile } from "react-icons/cg";
import { FaAddressBook, FaTimes } from "react-icons/fa";
import { CiMenuKebab } from "react-icons/ci";
import Header from "../components/components/Header";
import Table from "../components/components/Table";
import { FiMapPin } from "react-icons/fi";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "../components/components/Input";
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

// Helper para eliminar duplicados por `id`
const removeDuplicates = (arr: any[]) => {
  const seen = new Set();
  return arr.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const ITEMS_PER_PAGE = 15;

const SelectCustomer = () => {
  const router = useRouter();
  const { role, userData } = useAuth();
  const { isMobile } = useMobile();
  const { setSelectedClientId } = useClient();

  // ======================================================
  // Estados Principales
  // ======================================================
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sortQuery, setSortQuery] = useState<string>(""); // "campo:asc" o "campo:desc"
  const [searchParams, setSearchParams] = useState({
    hasDebt: "",
    hasDebtExpired: "",
    seller_id: role === "VENDEDOR" ? userData?.seller_id : "",
    hasArticlesOnSC: "",
  });

  // Estados para modales y selección actual
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isUpdateGPSModalOpen, setUpdateGPSModalOpen] = useState(false);
  const [isViewGPSModalOpen, setViewGPSModalOpen] = useState(false);
  const [isViewAllMapModalOpen, setViewAllMapModalOpen] = useState(false);

  // ======================================================
  // Referencias
  // ======================================================
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ======================================================
  // Consultas a APIs
  // ======================================================
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetCustomersPagQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      hasDebtExpired: searchParams.hasDebtExpired,
      hasDebt: searchParams.hasDebt,
      seller_id: searchParams.seller_id,
      hasArticlesOnSC: searchParams.hasArticlesOnSC,
      sort: sortQuery,
    },
    {
      refetchOnMountOrArgChange: true, // Cambiado a true
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  const { data: allCustomersData } = useGetCustomersPagQuery(
    {
      page: 1,
      limit: 1000, // O el valor apropiado para obtener todos los clientes
      query: searchQuery,
      hasDebtExpired: searchParams.hasDebtExpired,
      hasDebt: searchParams.hasDebt,
      seller_id: searchParams.seller_id,
      hasArticlesOnSC: searchParams.hasArticlesOnSC,
      sort: sortQuery,
    },
    {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );
  const markersCustomers = allCustomersData?.customers || [];
  const { data: paymentsConditionsData } = useGetPaymentConditionsQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);

  // ======================================================
  // Búsqueda con debounce
  // ======================================================
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setPage(1);
      setItems([]);
      setHasMore(true);
    }, 50), // Ajusta el delay a 300ms
    []
  );
  

  const handleResetSearch = useCallback(() => {
    setSearchQuery("");
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, []);

 // ======================================================
   // Efectos
   // ======================================================
   // Actualizar lista de artículos y evitar duplicados
   useEffect(() => {
     if (data?.customers) {
       setItems((prev) => {
         if (page === 1) {
           return data.customers;
         }
         const newArticles = data.customers.filter(
           (article) => !prev.some((item) => item.id === article.id)
         );
         return [...prev, ...newArticles];
       });
       setHasMore(data.customers.length === ITEMS_PER_PAGE);
     }
   }, [data?.customers, page]);
 
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
 

  // ======================================================
  // Handlers para Filtros y Ordenamiento
  // ======================================================
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      const newSortQuery =
        currentField === field
          ? currentDirection === "asc"
            ? `${field}:desc`
            : `${field}:asc`
          : `${field}:asc`;
      setSortQuery(newSortQuery);
      setPage(1);
      setItems([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  const handleDebtFilter = () => {
    setSearchParams((prev) => ({
      ...prev,
      hasDebt: prev.hasDebt === "true" ? "" : "true",
    }));
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

  const handleExpiredDebtFilter = () => {
    setSearchParams((prev) => ({
      ...prev,
      hasDebtExpired: prev.hasDebtExpired === "true" ? "" : "true",
    }));
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

  const handleHasArticlesOnSC = () => {
    setSearchParams((prev) => ({
      ...prev,
      hasArticlesOnSC: prev.hasArticlesOnSC === "true" ? "" : "true",
    }));
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

  // ======================================================
  // Handlers para Modales y Selección
  // ======================================================
  const toggleMenu = (customerId: string) => {
    setActiveMenu(activeMenu === customerId ? null : customerId);
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedClientId(customerId);
    if (role === "VENDEDOR") {
      router.push("/orders/orderSeller");
    } else {
      router.push("/dashboard");
    }
  };

  const openUpdateModal = (id: string) => {
    setCurrentCustomerId(id);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentCustomerId(null);
  };

  const openUpdateGPSModal = (id: string) => {
    setCurrentCustomerId(id);
    setUpdateGPSModalOpen(true);
  };
  const closeUpdateGPSModal = () => {
    setUpdateGPSModalOpen(false);
    setCurrentCustomerId(null);
  };

  const openViewGPSModal = (id: string) => {
    setCurrentCustomerId(id);
    setViewGPSModalOpen(true);
  };
  const closeViewGPSModal = () => {
    setViewGPSModalOpen(false);
    setCurrentCustomerId(null);
  };

  // ======================================================
  // tableData y Encabezado
  // ======================================================
  const filteredItems = useMemo(() => removeDuplicates(items), [items]);

  const tableData = useMemo(
    () =>
      filteredItems.map((customer) => {
        const paymentCondition = paymentsConditionsData?.find(
          (data) => data.id === customer.payment_condition_id
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
      }),
    [
      filteredItems,
      paymentsConditionsData,
      activeMenu,
      handleSelectCustomer,
      openUpdateGPSModal,
      openUpdateModal,
      toggleMenu,
      openViewGPSModal,
    ]
  );

  const tableHeader = useMemo(
    () => [
      { component: <CgProfile className="text-center text-xl" />, key: "icon" },
      { name: "Id", key: "id", important: true },
      { name: "Customer", key: "customer", important: true, sortable: true },
      { name: "Address", key: "address" },
      { name: "Payment Condition", key: "payment-condition" },
      { name: "Status Account", key: "status-account", sortable: true },
      { name: "Expired Debt", key: "expired-debt", sortable: true },
      { name: "Articles on Cart", key: "articles-on-cart", sortable: true },
      { name: "GPS", key: "gps", important: true },
      { component: <CiMenuKebab className="text-center text-xl" />, key: "menu", important: true },
    ],
    []
  );

  const headerBody = useMemo(
    () => ({
      buttons: [
        {
          logo: <FiMapPin />,
          title: "View On Map",
          onClick: () => setViewAllMapModalOpen(true),
        },
        { logo: <AiOutlineDownload />, title: "Download" },
      ],
      filters: [
        {
          content: (
            <select
              value={searchParams.seller_id}
              onChange={(e) =>
                setSearchParams({ ...searchParams, seller_id: e.target.value })
              }
              className="border border-gray-300 rounded p-2"
              disabled={role === "VENDEDOR"}
            >
              <option value="">Seller...</option>
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
              placeholder="Buscar..."
              value={searchQuery}
              // Cambiar de setSearchQuery a debouncedSearch para un comportamiento consistente
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
              title="Debt"
              onChange={handleDebtFilter}
              active={searchParams.hasDebt === "true"}
            />
          ),
        },
        {
          content: (
            <ButtonOnOff
              title="Expired D."
              onChange={handleExpiredDebtFilter}
              active={searchParams.hasDebtExpired === "true"}
            />
          ),
        },
        {
          content: (
            <ButtonOnOff
              title="Art. En Carrito"
              onChange={handleHasArticlesOnSC}
              active={searchParams.hasArticlesOnSC === "true"}
            />
          ),
        },
      ],
      results: `${data?.totalCustomers || 0} Results`,
    }),
    [searchQuery, data?.totalCustomers, debouncedSearch, handleResetSearch, searchParams]
  );

  // ======================================================
  // Renderizado Condicional
  // ======================================================
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
        <h3 className="text-bold p-2">SELECT CUSTOMER</h3>
        {isMobile ? (
          <div className="bg-zinc-900 p-4 rounded-lg">
            {/* Versión móvil: filtros y búsqueda simplificada */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <ButtonOnOff
                  title="Deuda"
                  onChange={handleDebtFilter}
                  active={searchParams.hasDebt === "true"}
                />
                <ButtonOnOff
                  title="D. Vencida"
                  onChange={handleExpiredDebtFilter}
                  active={searchParams.hasDebtExpired === "true"}
                />
              </div>
              <div>
                <ButtonOnOff
                  title="Art. En Carrito"
                  onChange={handleHasArticlesOnSC}
                  active={searchParams.hasArticlesOnSC === "true"}
                />
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar..."
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
                {data?.totalCustomers || 0} Results
              </div>
            )}
          </div>
        ) : (
          <Header headerBody={headerBody} />
        )}

        {isMobile ? (
          <CustomerListMobile
            filteredItems={filteredItems}
            handleSelectCustomer={handleSelectCustomer}
          />
        ) : (
          <Table
            headers={tableHeader}
            data={tableData}
            onSort={handleSort}
            sortField={sortQuery.split(":")[0]}
            sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
          />
        )}

        {/* Modales */}
        <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
          {currentCustomerId && (
            <ResetPassword
              customerId={currentCustomerId}
              closeModal={closeUpdateModal}
            />
          )}
        </Modal>
        <Modal isOpen={isUpdateGPSModalOpen} onClose={closeUpdateGPSModal}>
          {currentCustomerId && (
            <UpdateGPS
              customerId={currentCustomerId}
              closeModal={closeUpdateGPSModal}
            />
          )}
        </Modal>
        {isViewGPSModalOpen && currentCustomerId && (
          <Modal isOpen={isViewGPSModalOpen} onClose={closeViewGPSModal}>
            <MapComponent
              key={`${currentCustomerId}-${Date.now()}`}
              currentCustomerId={currentCustomerId}
              closeModal={closeViewGPSModal}
            />
          </Modal>
        )}
        {isViewAllMapModalOpen && (
          <Modal isOpen={isViewAllMapModalOpen} onClose={() => setViewAllMapModalOpen(false)}>
            <MapModal
              customers={markersCustomers}
              onClose={() => setViewAllMapModalOpen(false)}
            />
          </Modal>
        )}

        {/* Elemento observador para Infinite Scroll */}
        <div ref={lastArticleRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default SelectCustomer;
