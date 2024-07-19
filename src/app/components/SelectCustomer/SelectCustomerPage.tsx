import React from "react";
import Header from "./components/Header";
import Table from "../components/Table";
import { CgProfile } from "react-icons/cg";
import { CiMenuKebab } from "react-icons/ci";

const SelectCustomerPage = () => {
    const headersTable = [
        <CgProfile className="text-center text-xl"/>,
        "Customer",
        "Name",
        "Address",
        "Payment Condition",
        "Status Account",
        "Expired Debt",
        "Use Days WEB (%)",
        "Pendings With Stock",
        "Articles on Cart",
        "GPS",
        <CiMenuKebab className="text-center text-xl"/>
    ]
  return (
    <div className="gap-4">
      <h3 className="text-bold p-4">SELECT CUSTOMER</h3>
      <Header />
      <Table headers={headersTable}/>
    </div>
  );
};

export default SelectCustomerPage;
