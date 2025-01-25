"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useInfiniteScroll } from "../context/UseInfiniteScroll";
import { useAuth } from "../context/AuthContext";
require("dotenv").config();

const ITEMS_PER_PAGE = 15;

const SelectCustomer = () => {
  const router = useRouter();
  const { role, userData } = useAuth();

  // Estados básicos con tipos apropiados
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { setSelectedClientId } = useClient();
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isUpdateGPSModalOpen, setUpdateGPSModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(
    null
  );
  const [searchParams, setSearchParams] = useState({
    hasDebt: "",
    hasDebtExpired: "",
    seller_id: role === "VENDEDOR" ? userData?.seller_id : "",
  });

  // Queries de Redux con mejor manejo de tipos
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
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  const { data: paymentsConditionsData } = useGetPaymentConditionsQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data: documentsData } = useGetDocumentsQuery(null);
  const { data: countCustomersData } = useCountCustomersQuery(
    role === "VENDEDOR" ? { seller_id: userData?.seller_id } : {}
  );

  // Búsqueda optimizada con debounce
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setPage(1);
      setItems([]);
    }, 100),
    []
  );

  // Custom hook para infinite scroll
  const { observerRef, isLoading } = useInfiniteScroll({
    hasMore: data?.length === ITEMS_PER_PAGE,
    isLoading: isQueryLoading,
    onIntersect: () => setPage((prev) => prev + 1),
  });

  // Efecto para manejar la carga de artículos
  useEffect(() => {
    if (!isQueryLoading && data) {
      setItems((prev) => (page === 1 ? data : [...prev, ...data]));
    }
  }, [data, isQueryLoading, page]);

  // Manejadores optimizados
  const openUpdateModal = (id: string) => {
    setCurrentCustomerId(id);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentCustomerId(null);
    refetch();
  };

  const openUpdateGPSModal = (id: string) => {
    setCurrentCustomerId(id);
    setUpdateGPSModalOpen(true);
  };
  const closeUpdateGPSModal = () => {
    setUpdateGPSModalOpen(false);
    setCurrentCustomerId(null);
    refetch();
  };

  const handleResetSearch = useCallback(() => {
    setSearchQuery("");
    setPage(1);
    setItems([]);
  }, []);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const toggleMenu = (customerId: string) => {
    setActiveMenu(activeMenu === customerId ? null : customerId);
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedClientId(customerId);
    router.push("/catalogue");
  };

  const tableData = items?.map((customer) => {
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
        debtExpired.amount = (debtExpired.amount || 0) + doc.amount;
      } else {
        debt.amount = (debt.amount || 0) + doc.amount; // Suma en debt
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
    refetch();
  };

  const handleExpiredDebtFilter = () => {
    setSearchParams((prev) => ({
      ...prev,
      hasDebtExpired: prev.hasDebtExpired === "true" ? "" : "true",
    }));
    setPage(1);
    refetch();
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
                className="right-2 top-1/2 -translate-y-1/2"
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
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

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
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default SelectCustomer;
