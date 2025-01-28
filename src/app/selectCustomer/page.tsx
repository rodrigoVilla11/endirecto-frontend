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
import ButtonOnOff from "../components/components/ButtonOnOff";
import {
  useCountCustomersQuery,
  useGetCustomersPagQuery,
} from "@/redux/services/customersApi";
import PrivateRoute from "../context/PrivateRoutes";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetDocumentsQuery } from "@/redux/services/documentsApi";
import { useGetPaymentConditionsQuery } from "@/redux/services/paymentConditionsApi";
import { useClient } from "../context/ClientContext";
import { useRouter } from "next/navigation";
import Modal from "../components/components/Modal";
import ResetPassword from "./ResetPassword";
import UpdateGPS from "./UpdateGPS";
import debounce from "../context/debounce";
import { useAuth } from "../context/AuthContext";
import { useMobile } from "../context/ResponsiveContext";

const ITEMS_PER_PAGE = 15;

// Helper para eliminar duplicados por `id`
const removeDuplicates = (arr: any[]) => {
  const seen = new Set();
  return arr.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const SelectCustomer = () => {
  const router = useRouter();
  const { role, userData } = useAuth();
  const { isMobile } = useMobile();

  // Estados básicos con tipos apropiados
  const [page, setPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { setSelectedClientId } = useClient();
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isUpdateGPSModalOpen, setUpdateGPSModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(
    null
  );
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    hasDebt: "",
    hasDebtExpired: "",
    seller_id: role === "VENDEDOR" ? userData?.seller_id : "",
  });

  // References
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Redux queries
  const { data: countCustomersData } = useCountCustomersQuery(
    role === "VENDEDOR" ? { seller_id: userData?.seller_id } : {}
  );
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
    },
    {
      refetchOnMountOrArgChange: false, // Desactivar refetch automático
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );
  const { data: paymentsConditionsData } = useGetPaymentConditionsQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data: documentsData } = useGetDocumentsQuery(null);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setPage(1);
      setItems([]);
      setHasMore(true);
    }, 100),
    []
  );

  // Effect para manejar la carga de artículos
  useEffect(() => {
    const loadItems = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newItems = result || [];

          if (page === 1) {
            // Filtrar duplicados por si el backend envía repetidos en la primera página
            setItems(removeDuplicates(newItems));
          } else {
            // Concatenar y eliminar duplicados
            setItems((prev) => removeDuplicates([...prev, ...newItems]));
          }

          // Actualizar `hasMore` en base a cuántos items se recibieron
          setHasMore(newItems.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading items:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadItems();
  }, [page, searchQuery, searchParams, refetch]);

  // Intersection Observer para infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5, rootMargin: "200px 0px" } // Ajusta rootMargin según necesidad
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

  // Manejadores optimizados
  const openUpdateModal = (id: string) => {
    setCurrentCustomerId(id);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentCustomerId(null);
    // Evitar llamar a refetch para no reiniciar la lista
    // Si necesitas actualizar los datos, considera una lógica diferente
  };

  const openUpdateGPSModal = (id: string) => {
    setCurrentCustomerId(id);
    setUpdateGPSModalOpen(true);
  };
  const closeUpdateGPSModal = () => {
    setUpdateGPSModalOpen(false);
    setCurrentCustomerId(null);
    // Evitar llamar a refetch para no reiniciar la lista
  };

  const handleResetSearch = useCallback(() => {
    setSearchQuery("");
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, []);

  // Función para filtrar duplicados
  const filteredItems = useMemo(() => removeDuplicates(items), [items]);

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

  const toggleMenu = (customerId: string) => {
    setActiveMenu(activeMenu === customerId ? null : customerId);
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedClientId(customerId);
    if (role === "VENDEDOR") {
      router.push("/orders/orderSeller");
    } else {
      router.push("/catalogue");
    }
  };

  const tableData = filteredItems?.map((customer) => {
    const filteredDocuments = documentsData
      ?.filter((data) => customer.documents_balance.includes(data.id))
      .map((data) => ({
        amount: parseFloat(data.amount) || 0, // Asegúrate de convertir a número
        expiration_status: data.expiration_status || "unknown",
      }));

    const debt = {
      amount: 0,
    };
    const debtExpired = {
      amount: 0,
    };

    // Sumar montos según expiration_status
    filteredDocuments?.forEach((doc) => {
      if (doc.expiration_status === "VENCIDO") {
        debtExpired.amount += doc.amount;
      } else {
        debt.amount += doc.amount; // Suma en debt
      }
    });
    const paymentCondition = paymentsConditionsData?.find(
      (data) => data.id === customer.payment_condition_id
    );

    return {
      key: customer.id,
      icon: (
        <div className="rounded-full h-8 w-8 bg-secondary text-white flex justify-center items-center">
          <p>{customer.name.charAt(0).toUpperCase()}</p>{" "}
        </div>
      ),
      "customer-id": customer.id,
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
      "status-account": debt.amount,
      "expired-debt": debtExpired.amount,
      "use-days-web": "50%", // Conectar
      "articles-on-cart": customer.shopping_cart.length, // Conectar
      gps: <FiMapPin />,
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

  const tableHeader = [
    {
      component: <CgProfile className="text-center text-xl" />,
      key: "profile",
    },
    { name: "Customer", key: "customer" },
    { name: "Name", key: "name" },
    { name: "Address", key: "address" },
    { name: "Payment Condition", key: "payment-condition" },
    { name: "Status Account", key: "status-account" },
    { name: "Expired Debt", key: "expired-debt" },
    { name: "Use Days WEB (%)", key: "use-days-web" },
    { name: "Articles on Cart", key: "articles-on-cart" },
    { name: "GPS", key: "gps" },
    {
      component: <CiMenuKebab className="text-center text-xl" />,
      key: "menu",
    },
  ];

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

  const headerBody = {
    buttons: [
      { logo: <FiMapPin />, title: "View On Map", onClick: () => {} },
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
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                debouncedSearch(e.target.value)
              }
              className="pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleResetSearch}
                aria-label="Clear search"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
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
    ],
    results: `${countCustomersData || 0} Results`,
  };

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}
    >
      <div className="gap-4">
        <h3 className="text-bold p-4">SELECT CUSTOMER</h3>
        {isMobile ? (
          <div className="relative flex flex-col items-center justify-center">
            <div className="flex items-center justify-center mb-2">
              <div className="flex flex-col gap-3 flex-1">
                <ButtonOnOff
                  title="Debt"
                  onChange={handleDebtFilter}
                  active={searchParams.hasDebt === "true"}
                />
                <ButtonOnOff
                  title="Expired D."
                  onChange={handleExpiredDebtFilter}
                  active={searchParams.hasDebtExpired === "true"}
                />
              </div>
              <div className="flex flex-col gap-3 flex-1 ">
                <ButtonOnOff
                  title="Articles on C."
                  // onChange={handleExpiredDebtFilter}
                  // active={searchParams.hasDebtExpired === "true"}
                />
              </div>
            </div>
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                debouncedSearch(e.target.value)
              }
              className="pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleResetSearch}
                aria-label="Clear search"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ) : (
          <Header headerBody={headerBody} />
        )}
        {isMobile ? (
          <div className="bg-white rounded-lg shadow-sm">
            {filteredItems?.map((customer) => (
              <div
                key={customer.id}
                className={`flex items-center gap-3 p-3 active:bg-gray-50 transition-colors`}
              >
                {/* Avatar compacto */}
                <div className="rounded-full h-9 w-9 bg-primary text-white flex justify-center items-center text-sm font-medium flex-shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>

                {/* Contenido principal optimizado para móvil */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div
                    onClick={() => handleSelectCustomer(customer.id)}
                    className="flex items-baseline gap-2"
                  >
                    <span className="text-[15px] font-medium text-gray-900 truncate">
                      {customer.name}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      #{customer.id}
                    </span>
                  </div>

                  {/* Info secundaria compacta */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-300">•</span>
                    {customer.phone && (
                      <span className="text-xs text-gray-500">
                        {customer.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Indicador táctil */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            ))}

            {/* Estado vacío mobile-friendly */}
            {!filteredItems?.length && (
              <div className="p-6 text-center">
                <div className="text-gray-400 text-3xl mb-2">🧑💼</div>
                <p className="text-sm text-gray-500">
                  No se encontraron clientes
                </p>
              </div>
            )}
          </div>
        ) : (
          <Table headers={tableHeader} data={tableData} />
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

        {/* Elemento observador para infinite scroll */}
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default SelectCustomer;
