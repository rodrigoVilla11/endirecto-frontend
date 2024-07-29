import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";

const page = () => {
  const tableHeader = [
    { name: "Branch", key: "branch" },
    { name: "Seller", key: "seller" },
    { name: "Date", key: "date" },
    { name: "Value", key: "value" },
    { name: "Amount", key: "amount" },
  ];
  const headerBody = {
    buttons: [
    ],
    filters: [
     
      {
        content: <Input placeholder={"Search..."}/>,
      }
    ],
    secondSection: {title: "Total", amount: "$ 0,00"},
    results: "2 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">COLLECTIONS UNSUMMARIES</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default page;
