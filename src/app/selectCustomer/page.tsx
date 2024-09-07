'use client'
import React from "react";
import { CgProfile } from "react-icons/cg";
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
    { name: "Pendings With Stock", key: "pendings-with-stock" },
    { name: "Articles on Cart", key: "articles-on-cart" },
    { name: "GPS", key: "gps" },
    { component: <CiMenuKebab className="text-center text-xl" />, key: "menu" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <FiMapPin/>,
        title: "View On Map",
      },
      {
        logo: <AiOutlineDownload/>,
        title: "Download",
      },
    ],
    filters: [
      {
        content: <Buttons title={"Seller"} />,
      },
      {
        content: <Input placeholder={"Search..."}/>,
      },
      {
        content: <ButtonOnOff title={"Debt"}/>
       
      },
      {
        content: <ButtonOnOff title={"Expired D."}/>
      },
    ],
    results: "2203 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="text-bold p-4">SELECT CUSTOMER </h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default SelectCustomer;
