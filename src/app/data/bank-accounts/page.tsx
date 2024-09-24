import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa6";

const Page = () => {
  const tableHeader = [
    { name: "Id", key: "id" },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Bank", key: "bank" },
    { name: "Account", key: "account" },
    { name: "CBU", key: "cbu" },
    { name: "Alias", key: "alias" },
    { name: "QR", key: "qr" },
    { name: "Publish", key: "publish" },

  ];
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">BANK ACCOUNTS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default Page;
