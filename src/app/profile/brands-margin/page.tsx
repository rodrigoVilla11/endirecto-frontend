import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa";
import { IoMdMenu } from "react-icons/io";

const Page = () => {
  const tableHeader = [
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Brand", key: "brand" },
    { name: "Margin", key: "margin" },
  ];
  const headerBody = {
    buttons: [{
        logo: <IoMdMenu />,
        title: "Massive Change",
      },],
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">MARGINS BY BRAND</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default Page;
