"use client";
import React, { useEffect, useRef, useState } from "react";
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
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: countFaqsData } = useCountFaqsQuery(null);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentFaqId, setCurrentFaqId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const {
    data: faqs,
    error,
    isLoading,
    refetch,
  } = useGetFaqsPagQuery({ page, limit, query: searchQuery });

  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          const newBrands = result.data || []; // Garantiza que siempre sea un array
          setItems((prev) => [...prev, ...newBrands]);
        })
        .catch((error) => {
          console.error("Error fetching articles:", error);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [page]);

  // Configurar Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [isFetching]);

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
    items?.map((faq) => ({
      key: faq._id,
      question: faq.question,
      answer: faq.answer,
      edit: (
        <div className="flex justify-center items-center">
          <FaPencil
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => openUpdateModal(faq._id)}
          />
        </div>
      ),
      erase: (
        <div className="flex justify-center items-center">
          <FaTrashCan
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => openDeleteModal(faq._id)}
          />
        </div>
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

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "MARKETING"]}>
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
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
