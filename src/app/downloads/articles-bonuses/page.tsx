"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { AiOutlineDownload } from "react-icons/ai";
import {
  useCountArticlesBonusesQuery,
  useGetArticlesBonusesPagQuery,
} from "@/redux/services/articlesBonusesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetItemsQuery } from "@/redux/services/itemsApi";
import {
  useGetAllArticlesQuery,
  useGetArticlesQuery,
} from "@/redux/services/articlesApi";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, error, isLoading, refetch } = useGetArticlesBonusesPagQuery({
    page,
    limit,
    query: searchQuery,
  });
  const { data: countArticlesBonusesData } = useCountArticlesBonusesQuery(null);
  const { data: brandsData } = useGetBrandsQuery(null);
  const { data: itemsData } = useGetItemsQuery(null);
  const { data: articlesData } = useGetAllArticlesQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = data?.map((articleBonus) => {
    const brand = brandsData?.find((data) => data.id == articleBonus.brand_id);
    const item = itemsData?.find((data) => data.id == articleBonus.item_id);
    const article = articlesData?.find(
      (data) => data.id == articleBonus.article_id
    );

    return (
      {
        key: articleBonus.id,
        brand: brand?.name,
        item: item?.name,
        article: article?.name,
        discount: `${articleBonus.percentage_1}%`,
      } 
    );
  });

  const tableHeader = [
    { name: "Brand", key: "brand" },
    { name: "Item", key: "item" },
    { name: "Article", key: "article" },
    { name: "Discount 1", key: "discount" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
    ],
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
    results: `${countArticlesBonusesData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countArticlesBonusesData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">BONUSES</h3>
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
            Page {page} of {Math.ceil((countArticlesBonusesData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={
              page === Math.ceil((countArticlesBonusesData || 0) / limit)
            }
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default Page;
