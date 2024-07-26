import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { AiOutlineDownload } from "react-icons/ai";
import { FaPlus } from "react-icons/fa";
import { FaPencil, FaTrashCan } from "react-icons/fa6";

const page = () => {
  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: "Number", key: "number" },
    { name: "Status", key: "status" },
    { name: "Type", key: "type" },
    { name: "Description", key: "description" },
    { name: "Customer", key: "customer" },
    { name: "User", key: "user" },
    { name: "Branch", key: "branch" },
    { name: "Date", key: "date" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: "New",
      },
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
            <option value="order">STATUS</option>
          </select>
        ),
      },
      {
        content: (
          <select>
            <option value="order">TYPE</option>
          </select>
        ),
      },
      {
        content: <Input placeholder={"Number"} />,
      },
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "0 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">RECLAIMS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default page;
