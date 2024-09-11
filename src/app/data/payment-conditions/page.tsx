"use client";
import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetPaymentConditionsQuery } from "@/redux/services/paymentConditionsApi";

const page = () => {
  const { data, error, isLoading, refetch } =
    useGetPaymentConditionsQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;
  const tableData = data?.map((payment_condition) => ({
    key: payment_condition.id,
    id: payment_condition.id,
    name: payment_condition.name,
    percentage: payment_condition.percentage,
    default: payment_condition.default
  }));
  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    { name: "Percentage", key: "percentage" },
    { name: "Default", key: "default" },
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
      <h3 className="font-bold p-4">PAYMENT CONDITIONS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData}/>
    </div>
  );
};

export default page;
