"use client";
import React, { useState } from "react";
import { CgProfile } from "react-icons/cg";
import { FaAddressBook } from "react-icons/fa";
import { CiMenuKebab } from "react-icons/ci";
import Header from "../components/components/Header";
import Table from "../components/components/Table";
import { FiMapPin } from "react-icons/fi";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "../components/components/Input";
import Buttons from "../components/components/Buttons";
import ButtonOnOff from "../components/components/ButtonOnOff";
import {
  useCountCustomersQuery,
  useGetCustomersPagQuery,
} from "@/redux/services/customersApi";
import PrivateRoute from "../context/PrivateRoutes";
require("dotenv").config();

const SelectCustomer = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, error, isLoading, refetch } = useGetCustomersPagQuery({
    page,
    limit,
    query: searchQuery,
  });

  const { data: countCustomersData } = useCountCustomersQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  // Función para manejar el clic en el menú Kebab
  const toggleMenu = (customerId: string) => {
    setActiveMenu(activeMenu === customerId ? null : customerId);
  };

  const tableData =
    data?.map((customer) => ({
      key: customer.id,
      icon: (
        <div className="rounded-full h-8 w-8 bg-secondary text-white flex justify-center items-center">
          <p>{customer.name.charAt(0).toUpperCase()}</p>{" "}
        </div>
      ),
      "customer-id": customer.id,
      customer: customer.name,
      address: (
        <div className="relative group">
          <span>
            <FaAddressBook className="text-center text-xl" />
          </span>
          <div className="absolute left-full bottom-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
            {customer.address}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          </div>
        </div>
      ),
      "payment-condition": customer.payment_condition_id, // Conectar populate
      "status-account": "$0,00",
      "expired-debt": "$0,00", // Conectar
      "use-days-web": "50%", // Conectar
      "articles-on-cart": "3", // Conectar
      gps: <FiMapPin />,
      menu: (
        <div className="relative">
          <CiMenuKebab
            className="text-center text-xl cursor-pointer"
            onClick={() => toggleMenu(customer.id)}
          />
          {activeMenu === customer.id && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                Actualizar GPS
              </button>
              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                Resetear contraseña
              </button>
            </div>
          )}
        </div>
      ),
    })) || [];

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

  const headerBody = {
    buttons: [
      { logo: <FiMapPin />, title: "View On Map" },
      { logo: <AiOutlineDownload />, title: "Download" },
    ],
    filters: [
      { content: <Buttons title={"Seller"} /> },
      {
        content: (
          <Input
            placeholder={"Search..."}
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                refetch();
              }
            }}
          />
        ),
      },
      { content: <ButtonOnOff title={"Debt"} /> },
      { content: <ButtonOnOff title={"Expired D."} /> },
    ],
    results: searchQuery
      ? `${data?.length || 0} Results`
      : `${countCustomersData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countCustomersData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <PrivateRoute requiredRole="administrador">
      <div className="gap-4">
        <h3 className="text-bold p-4">SELECT CUSTOMER</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <div className="flex justify-between items-center p-4">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <p>
            Page {page} of {Math.ceil((countCustomersData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countCustomersData || 0) / limit)}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default SelectCustomer;
