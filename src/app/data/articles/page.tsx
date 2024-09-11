"use client";
import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPencil, FaTrashCan } from "react-icons/fa6";
import { AiOutlineDownload } from "react-icons/ai";
import { FaRegFilePdf } from "react-icons/fa";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetItemsQuery } from "@/redux/services/itemsApi";

const page = () => {
  const { data: brandData } = useGetBrandsQuery(null);
  const { data: itemData } = useGetItemsQuery(null);
  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page: 1,
    limit: 10,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;
  const tableData = data?.map((article) => {
    const brand = brandData?.find((data) => data.id == article.brand_id);
    const item = itemData?.find((data) => data.id == article.item_id);

    return {
      key: article.id,
      brand: brand?.name || "NO BRAND",
      image: article.images,
      pdf: article.pdfs,
      item: item?.name || "NO ITEM",
      id: article.id,
      supplier: article.supplier_code,
      name: article.name,
      edit: <FaPencil className="text-center text-lg" />,
      erase: <FaTrashCan className="text-center text-lg" />,
    };
  });
  const tableHeader = [
    { name: "Brand", key: "brand" },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    {
      component: <FaRegFilePdf className="text-center text-xl" />,
      key: "pdf",
    },
    { name: "Item", key: "item" },
    { name: "Id", key: "id" },
    { name: "Supplier Code", key: "supplier code" },
    { name: "Name", key: "name" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
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
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">ARTICLES</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData} />
    </div>
  );
};

export default page;
