import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";

const page = () => {
  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Article", key: "article" },
    { name: "Quantity", key: "quantity" },
    { name: "Branch", key: "branch" },
    { name: "Next Entry", key: "next-entry" },
    { name: "Date Next Entry", key: "date-next-entry" },


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
      <h3 className="font-bold p-4">STOCK</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default page;
