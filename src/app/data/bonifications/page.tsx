import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { AiOutlineDownload } from "react-icons/ai";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const tableHeader = [
    { name: "Client", key: "client" },
    { name: "Brand", key: "brand" },
    { name: "Item", key: "item" },
    { name: "Aticle", key: "aticle" },
    { name: "Discount 1", key: "discount" },
    { name: "Seller", key: "seller" },
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
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4 text-white">BONUSES</h3>
        <Header headerBody={headerBody} />
        {/* <Table headers={tableHeader} /> */}
      </div>
    </PrivateRoute>
  );
};

export default Page;
