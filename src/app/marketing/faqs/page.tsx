"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import {
  useCountFaqsQuery,
  useGetFaqsPagQuery,
  useGetFaqsQuery,
} from "@/redux/services/faqsApi";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import CreateFaqComponent from "./CreateFaq";
import UpdateFaqComponent from "./UpdateFaq";
import DeleteFaq from "./DeleteFaq";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: countFaqsData } = useCountFaqsQuery(null);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentFaqId, setCurrentFaqId] = useState<string | null>(null);

  const {
    data: faqs,
    error,
    isLoading,
    refetch,
  } = useGetFaqsPagQuery({ page, limit, query: searchQuery });

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  const openUpdateModal = (id: string) => {
    setCurrentFaqId(id);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentFaqId(null);
    refetch();
  };

  const openDeleteModal = (id: string) => {
    setCurrentFaqId(id);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentFaqId(null);
    refetch();
  };

  const tableData =
    faqs?.map((faq) => ({
      key: faq._id,
      question: faq.question,
      answer: faq.answer,
      edit: (
        <FaPencil
          className="text-center text-lg hover:cursor-pointer"
          onClick={() => openUpdateModal(faq._id)}
        />
      ),
      erase: (
        <FaTrashCan
          className="text-center text-lg hover:cursor-pointer"
          onClick={() => openDeleteModal(faq._id)}
        />
      ),
    })) || [];

  const tableHeader = [
    { name: "Question", key: "question" },
    { name: "Answer", key: "answer" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: "New",
        onClick: openCreateModal,
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
      ? `${faqs?.length || 0} Results`
      : `${countFaqsData || 0} Results`,
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countFaqsData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <PrivateRoute>
      <div className="gap-4">
        <h3 className="font-bold p-4">FAQS</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateFaqComponent closeModal={closeCreateModal} />
        </Modal>

        <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
          {currentFaqId && (
            <UpdateFaqComponent
              faqId={currentFaqId}
              closeModal={closeUpdateModal}
            />
          )}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeleteFaq faqId={currentFaqId || ""} closeModal={closeDeleteModal} />
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
            Page {page} of {Math.ceil((countFaqsData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countFaqsData || 0) / limit)}
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
