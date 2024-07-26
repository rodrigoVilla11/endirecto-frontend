import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPencil } from "react-icons/fa6";
import { AiOutlineDownload } from "react-icons/ai";
import { FaRegFilePdf } from "react-icons/fa";

const page = () => {
  const tableHeader = [
    { name: "Brand", key: "brand" },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    {
      component: <FaRegFilePdf className="text-center text-xl" />,
      key: "pdf",
    },
    { name: "Item", key: "item" },
    { name: "Id", key: "id" },
    { name: "Supplier Code", key: "supplier code" },
    { name: "Name", key: "name" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
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
    <div className="gap-4">
      <h3 className="font-bold p-4">ARTICLES</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default page;
