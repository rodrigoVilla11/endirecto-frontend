import React from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";

const page = () => {
  const tableData = [{}]
  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: "Customer", key: "customer" },
    { name: "Type", key: "type" },
    { name: "Name", key: "name" },
    { name: "Number", key: "number" },
    { name: "Date", key: "date" },
    { name: "Amount", key: "amount" },
    { name: "Balance", key: "balance" },
    { name: "Expiration", key: "expiration" },
    { name: "Logistic", key: "logistic" },
    { name: "Seller", key: "seller" }
  ];
  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload/>,
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
        content: <Input placeholder={"Search..."}/>,
      }
    ],
    secondSection: {title: "Total Owed", amount: "$ 306.137.224,33"},
    results: "936 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">STATUS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData}/>
    </div>
  );
};

export default page;
