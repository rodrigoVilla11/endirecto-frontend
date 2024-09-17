"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetFaqsQuery } from "@/redux/services/faqsApi";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import CreateFaqComponent from "./CreateFaq";
import UpdateFaqComponent from "./UpdateFaq";
import DeleteFaq from "./DeleteFaq";

const Page = () => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false); 
  const [currentFaqId, setCurrentFaqId] = useState<string | null>(null);

  const { data: faqs, error, isLoading, refetch } = useGetFaqsQuery(null);

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
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: `${faqs?.length} Results`,
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  return (
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
    </div>
  );
};

export default Page;
