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
import { FaPlus, FaTimes } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import CreateFaqComponent from "./CreateFaq";
import UpdateFaqComponent from "./UpdateFaq";
import DeleteFaq from "./DeleteFaq";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // Estados básicos
  const [page, setPage] = useState(1);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados para modales
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [currentFaqId, setCurrentFaqId] = useState<string | null>(null);

  // Referencias
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux (mantenidas como estaban)
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetFaqsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
  });

  // Búsqueda con debounce
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setFaqs([]);
    setHasMore(true);
  }, 100);

  // Efecto para manejar la carga inicial y las búsquedas
  useEffect(() => {
    const loadArticles = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newFaqs = result || [];

          if (page === 1) {
            setFaqs(newFaqs);
          } else {
            setFaqs((prev) => [...prev, ...newFaqs]);
          }

          setHasMore(newFaqs.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading faqs:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadArticles();
  }, [page, searchQuery]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    const currentObserver = observerRef.current;
    if (currentObserver) {
      observer.observe(currentObserver);
    }

    return () => {
      if (currentObserver) {
        observer.unobserve(currentObserver);
      }
    };
  }, [hasMore, isLoading]);

  // Manejadores de modales
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

  // Reset de búsqueda
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setFaqs([]);
    setHasMore(true);
  };

  const tableData =
    faqs?.map((faq) => ({
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
          <div className="relative">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                debouncedSearch(e.target.value)
              }
              className="pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleResetSearch}
                aria-label="Clear search"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: `${faqs?.length || 0} Results`,
  };

  if (isQueryLoading && faqs.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading faqs. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "MARKETING"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">FAQS</h3>
        <Header headerBody={headerBody} />

        {isLoading && faqs.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No faqs found</div>
        ) : (
          <>
            <Table headers={tableHeader} data={tableData} />
            {isLoading && (
              <div ref={loadingRef} className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}
        <div ref={observerRef} className="h-10" />

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateFaqComponent closeModal={closeCreateModal} />
        </Modal>

        <Modal
          isOpen={isUpdateModalOpen}
          onClose={closeUpdateModal}
        >
          {currentFaqId && (
            <UpdateFaqComponent
              faqId={currentFaqId}
              closeModal={closeUpdateModal}
            />
          )}
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
        >
          <DeleteFaq
            faqId={currentFaqId || ""}
            closeModal={closeDeleteModal}
          />
        </Modal>
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
