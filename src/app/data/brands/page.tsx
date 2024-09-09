'use client'
import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPencil } from "react-icons/fa6";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";

const page = () => {
  const { data, error, isLoading, refetch } = useGetBrandsQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;
  const tableData = data?.map((brand) => ({
    key: brand.id,
    id: brand.id,
    name: brand.name,
    image: brand.image,
    sequence: brand.sequence,
    edit: <FaPencil className="text-center text-lg" />
  }));
  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
  ];
  const headerBody = {
    buttons: [
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
      <h3 className="font-bold p-4">BRANDS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData}/>
    </div>
  );
};

export default page;
