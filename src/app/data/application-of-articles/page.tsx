'use client'
import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa6";
import { useGetArticlesVehiclesQuery } from "@/redux/services/articlesVehicles";
import { useGetAllArticlesQuery, useGetArticlesQuery } from "@/redux/services/articlesApi";

const page = () => {
  const { data: articlesData } = useGetAllArticlesQuery(null);
  const { data, error, isLoading, refetch } = useGetArticlesVehiclesQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;
  const tableData = data?.map((item) => {
    const article = articlesData?.find((data) => data.id == item.article_id);

    return {
      image: article?.images || "NOT FOUND",
      article: article?.name || "NOT FOUND",
      brand: item?.brand,
      model: item?.model,
      engine: item?.engine,
      year: item?.year
    };
  });

  const tableHeader = [
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Article", key: "article" },
    { name: "Brand", key: "brand" },
    { name: "Model", key: "model" },
    { name: "Engine", key: "engine" },
    { name: "Year", key: "year" },
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
      <h3 className="font-bold p-4">APPLICATION OF ARTICLES</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData}/>
    </div>
  );
};

export default page;
