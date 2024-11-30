import Header from "@/app/components/components/Header";
import Input from "@/app/components/components/Input";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import React from "react";
import { FaTrashCan } from "react-icons/fa6";

const Page = () => {
  const tableHeader = [
    { name: "Date", key: "date" },
    { name: "Code", key: "code" },
    { name: "Service", key: "service" },
    { name: "Message", key: "message" },

    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "4 Results",
  };

  return (
    <PrivateRoute>
      <div className="gap-4">
        <h3 className="text-bold p-4">LOGS</h3>
        <Header headerBody={headerBody} />
        {/* <Table headers={tableHeader} /> */}
      </div>
    </PrivateRoute>
  );
};

export default Page;
