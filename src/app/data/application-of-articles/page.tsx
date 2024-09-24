"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa6";
import {
  useCountArticleVehicleQuery,
  useGetArticlesVehiclesPagQuery,
  useGetArticlesVehiclesQuery,
} from "@/redux/services/articlesVehicles";
import {
  useGetAllArticlesQuery,
  useGetArticlesQuery,
} from "@/redux/services/articlesApi";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: countArticleVehicleData } = useCountArticleVehicleQuery(null);

  const { data: articlesData } = useGetAllArticlesQuery(null);
  const { data, error, isLoading, refetch } = useGetArticlesVehiclesPagQuery({
    page,
    limit,
    query: searchQuery,
  });

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
      year: item?.year,
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
        content: (
          <Input
            placeholder={"Search..."}
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                refetch();
              }
            }}
          />
        ),
      },
    ],
    results: searchQuery
      ? `${data?.length || 0} Results`
      : `${countArticleVehicleData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countArticleVehicleData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">APPLICATION OF ARTICLES</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData} />
      <div className="flex justify-between items-center p-4">
        <button
          onClick={handlePreviousPage}
          disabled={page === 1}
          className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <p>
          Page {page} of {Math.ceil((countArticleVehicleData || 0) / limit)}
        </p>
        <button
          onClick={handleNextPage}
          disabled={page === Math.ceil((countArticleVehicleData || 0) / limit)}
          className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Page;
