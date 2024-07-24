import React from "react";
import Header from "./components/Header";
import Table from "../components/Table";
import { CgProfile } from "react-icons/cg";
import { CiMenuKebab } from "react-icons/ci";

const SelectCustomerPage = () => {
  const headersTable = [
    <CgProfile key="profile" className="text-center text-xl" />,
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
    <CiMenuKebab key="menu" className="text-center text-xl" />
  ];

  return (
    <div className="gap-4">
      <h3 className="text-bold p-4">SELECT CUSTOMER</h3>
      <Header />
      <Table headers={headersTable} />
    </div>
  );
};

export default SelectCustomerPage;
