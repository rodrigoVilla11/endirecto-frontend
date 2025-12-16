import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaLink, FaPencil, FaPlus, FaTrashCan } from "react-icons/fa6";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const tableHeader = [
    { name: "Name", key: "name" },
    { name: "Category", key: "category" },
    { name: "File", key: "file" },
    {
      component: <FaLink className="text-center text-xl" />,
      key: "link",
    },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: "New",
      },
    ],
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4 text-white">FILES</h3>
        <Header headerBody={headerBody} />
        {/* <Table headers={tableHeader} /> */}
      </div>
    </PrivateRoute>
  );
};

export default Page;
