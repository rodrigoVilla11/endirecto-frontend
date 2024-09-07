import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetSellersQuery } from "@/redux/services/sellersApi";

const page = () => {
  const { data, error, isLoading, refetch } = useGetSellersQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;
   console.log(data)
  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    { name: "Branch", key: "branch" },
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
      <h3 className="font-bold p-4">SELLERS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default page;
