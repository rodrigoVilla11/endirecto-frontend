import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaDownload } from "react-icons/fa";

const page = () => {
  const tableHeader = [
    { name: "Brand", key: "brand" },
    { name: "Type", key: "type" },
    { name: "Title", key: "title" },
    { name: "Description", key: "description" },
    { name: "Validity", key: "validity" },
    { name: "Date", key: "date" },
    {
      component: <FaDownload className="text-center text-xl" />,
      key: "download",
    },
  ];
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <select>
            <option value="order">TYPE</option>
          </select>
        ),
      },
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">NOTIFICATIONS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default page;
