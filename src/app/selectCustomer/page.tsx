"use client";
import React from "react";
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
import { useGetCustomersQuery } from "@/redux/services/customersApi";
require("dotenv").config();

const SelectCustomer = () => {
  const { data, error, isLoading, refetch } = useGetCustomersQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

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
            <FaAddressBook className="text-center text-xl"/>
          </span>
          <div className="absolute left-full bottom-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
            {customer.address}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          </div>
        </div>
      ),
      "payment-condition": customer.payment_condition_id, //Conectar populate
      "status-account": "$0,00",
      "expired-debt": "$0,00", // Conectar
      "use-days-web": "50%", // Conectar
      "articles-on-cart": "3", // Conectar
      gps: <FiMapPin />,
      menu: <CiMenuKebab className="text-center text-xl" />,
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
    { component: <CiMenuKebab className="text-center text-xl" />, key: "menu" },
  ];

  const headerBody = {
    buttons: [
      { logo: <FiMapPin />, title: "View On Map" },
      { logo: <AiOutlineDownload />, title: "Download" },
    ],
    filters: [
      { content: <Buttons title={"Seller"} /> },
      { content: <Input placeholder={"Search..."} /> },
      { content: <ButtonOnOff title={"Debt"} /> },
      { content: <ButtonOnOff title={"Expired D."} /> },
    ],
    results: `${data?.length} Results`,
  };

  return (
    <div className="gap-4">
      <h3 className="text-bold p-4">SELECT CUSTOMER </h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData} />
    </div>
  );
};

export default SelectCustomer;
