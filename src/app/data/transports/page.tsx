"use client"
import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetTransportsQuery } from "@/redux/services/transportsApi";

const Page = () => {
  const { data, error, isLoading, refetch } = useGetTransportsQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;
   
  const tableData = data?.map((transport) => ({
    key: transport.id,
    id: transport.id,
    name: transport.name,
    schedule: transport.schedule
  }));

  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    { name: "Schedules", key: "schedules" },
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
      <h3 className="font-bold p-4">TRANSPORTS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData}/>
    </div>
  );
};

export default Page;
