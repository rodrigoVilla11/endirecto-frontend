import Header from "@/app/components/components/Header";
import Input from "@/app/components/components/Input";
import Table from "@/app/components/components/Table";
import React from "react";
import { FaPencil } from "react-icons/fa6";

const Page = () => {
  const tableHeader = [
    { name: "Group", key: "group" },
    { name: "Description", key: "description" },
    { name: "Value", key: "value" },
    { name: "Salesman", key: "salesman" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
  ];
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: <select> <option value="GROUP">GROUP</option></select>,
      },
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "20 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="text-bold p-4">PARAMETERS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default Page;
