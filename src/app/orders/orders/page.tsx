import React from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { FaRegFilePdf } from "react-icons/fa6";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    {
      component: <FaRegFilePdf className="text-center text-xl" />,
      key: "pdf",
    },
    { name: "Number", key: "number" },
    { name: "Date", key: "date" },
    { name: "Total Without Taxes", key: "total-without-taxes" },
    { name: "Status", key: "status" },
    { name: "Budget", key: "budget" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
    ],
    filters: [
      {
        content: <Input placeholder={"Date From dd/mm/aaaa"} />,
      },
      {
        content: <Input placeholder={"Date To dd/mm/aaaa"} />,
      },
      {
        content: (
          <select>
            <option value="branch">BRANCH</option>
          </select>
        ),
      },
      {
        content: (
          <select>
            <option value="status">STATUS</option>
          </select>
        ),
      },
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "32 Results",
  };

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">ORDERS</h3>
        <Header headerBody={headerBody} />
        {/* <Table headers={tableHeader} /> */}
      </div>
    </PrivateRoute>
  );
};

export default Page;
