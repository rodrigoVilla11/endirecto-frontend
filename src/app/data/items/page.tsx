"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPencil } from "react-icons/fa6";
import {
  useCountItemsQuery,
  useGetItemsPagQuery,
  useGetItemsQuery,
} from "@/redux/services/itemsApi";
import Modal from "@/app/components/components/Modal";
import UpdateItemComponent from "./UpdateItem";

const page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  const {
    data: items,
    error,
    isLoading,
    refetch,
  } = useGetItemsPagQuery({
    page,
    limit,
  });
  const { data: countItemsData } = useCountItemsQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const openUpdateModal = (id: string) => {
    const encodedId = encodeURIComponent(id);
    setCurrentItemId(encodedId);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentItemId(null);
    refetch();
  };

  const tableData = items?.map((item) => ({
    key: item.id,
    id: item.id,
    name: item.name,
    image: item.image,
    edit: (
      <FaPencil
        className="text-center text-lg hover:cursor-pointer"
        onClick={() => openUpdateModal(item.id)}
      />
    ),
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
    buttons: [],
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countItemsData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">ITEMS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData} />
      <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
        {currentItemId && (
          <UpdateItemComponent
            itemId={currentItemId}
            closeModal={closeUpdateModal}
          />
        )}
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
          Page {page} of {Math.ceil((countItemsData || 0) / limit)}
        </p>
        <button
          onClick={handleNextPage}
          disabled={page === Math.ceil((countItemsData || 0) / limit)}
          className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default page;
