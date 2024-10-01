"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPencil, FaTrashCan } from "react-icons/fa6";
import { AiOutlineDownload } from "react-icons/ai";
import { FaRegFilePdf } from "react-icons/fa";
import {
  useCountArticlesQuery,
  useGetArticlesQuery,
} from "@/redux/services/articlesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetItemsQuery } from "@/redux/services/itemsApi";
import Modal from "@/app/components/components/Modal";
import UpdateArticleComponent from "./UpdateArticle";
import DeleteArticleComponent from "./DeleteArticle";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  

  const { data: brandData } = useGetBrandsQuery(null);
  const { data: itemData } = useGetItemsQuery(null);
  const { data: countArticlesData } = useCountArticlesQuery(null);
  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page,
    limit,
    query: searchQuery,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const openUpdateModal = (id: string) => {
    const encodedId = encodeURIComponent(id);
    setCurrentArticleId(encodedId);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentArticleId(null);
    refetch();
  };

  const openDeleteModal = (id: string) => {
    const encodedId = encodeURIComponent(id);
    setCurrentArticleId(encodedId);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentArticleId(null);
    refetch();
  };

  const tableData = data?.map((article) => {
    const brand = brandData?.find((data) => data.id === article.brand_id);
    const item = itemData?.find((data) => data.id === article.item_id);

    return {
      key: article.id,
      brand: brand?.name || "NO BRAND",
      image: <div className="flex justify-center items-center"><img src={article.images && article.images[0]} className="h-10"/></div> || "NOT FOUND",
      pdf: article.pdfs,
      item: item?.name || "NO ITEM",
      id: article.id,
      supplier: article.supplier_code,
      name: article.name,
      edit: (
        <div className="flex justify-center items-center">
          <FaPencil
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => openUpdateModal(article.id)}
          />
        </div>
      ),
      erase: (
        <div className="flex justify-center items-center">
          <FaTrashCan
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => openDeleteModal(article.id)}
          />
        </div>
      ),
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
      : `${countArticlesData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countArticlesData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <PrivateRoute>
      <div className="gap-4">
        <h3 className="font-bold p-4">ARTICLES</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
          {currentArticleId && (
            <UpdateArticleComponent
              articleId={currentArticleId}
              closeModal={closeUpdateModal}
            />
          )}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeleteArticleComponent
            articleId={currentArticleId || ""}
            closeModal={closeDeleteModal}
          />
        </Modal>

        <div className="flex justify-between items-center p-4">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <p>
            Page {page} of {Math.ceil((countArticlesData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countArticlesData || 0) / limit)}
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
