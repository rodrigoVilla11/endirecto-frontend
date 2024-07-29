import React from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaRegFilePdf } from "react-icons/fa";

const page = () => {
  const tableHeader = [
    {
      component: <AiOutlineDownload className="text-center text-xl" />,
      key: "info",
    },
    {
        component: <FaRegFilePdf className="text-center text-xl" />,
        key: "pdf",
      },
    { name: "Number", key: "number" },
    { name: "Date", key: "date" },
    { name: "Payment", key: "payment" },
    { name: "Amount", key: "amount" },
    { name: "Status", key: "status" },
    { name: "Notes", key: "notes" },
    { name: "Seller", key: "seller" }
  ];
  const headerBody = {
    buttons: [],
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
            <option value="status">STATUS</option>
          </select>
        ),
      },
      {
        content: <Input placeholder={"Search..."}/>,
      }
    ],
    results: "936 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">COLLECTIONS SUMMARIES</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default page;
