"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import { FaPlus, FaTimes } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import CreateFaqComponent from "./CreateFaq";
import UpdateFaqComponent from "./UpdateFaq";
import DeleteFaq from "./DeleteFaq";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";
import { useGetFaqsPagQuery } from "@/redux/services/faqsApi";
import { useTranslation } from "react-i18next";
import { GoPencil } from "react-icons/go";
import { IoIosTrash } from "react-icons/io";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Basic states
  const [page, setPage] = useState(1);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // States for modals
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [currentFaqId, setCurrentFaqId] = useState<string | null>(null);

  // References
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Redux query (returns an object { faqs: Faq[], total: number })
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

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setFaqs([]);
    setHasMore(true);
  }, 100);

  // Effect to load FAQs (initial load and on search)
  useEffect(() => {
    const loadFaqs = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          // Expecting the response to have the shape { faqs, total }
          const result = await refetch().unwrap();
          const newFaqs = result.faqs || [];
          if (page === 1) {
            setFaqs(newFaqs);
          } else {
            setFaqs((prev) => [...prev, ...newFaqs]);
          }
          setHasMore(newFaqs.length === ITEMS_PER_PAGE);
        } catch (err) {
          console.error("Error loading FAQs:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadFaqs();
  }, [page, searchQuery, isLoading, refetch]);

  // Intersection Observer for infinite scroll
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

  // Modal handlers
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

  // Reset search
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setFaqs([]);
    setHasMore(true);
  };

  const tableData =
    faqs.map((faq) => ({
      key: faq._id,
      question: faq.question,
      answer: faq.answer,
      edit: (
        <div className="flex justify-center items-center">
          <GoPencil
            className="text-center font-bold text-3xl text-white hover:cursor-pointer hover:text-black bg-green-400  p-1.5 rounded-sm"
            onClick={() => openUpdateModal(faq._id)}
          />
        </div>
      ),
      erase: (
        <div className="flex justify-center items-center">
          <IoIosTrash
            className="text-center text-3xl text-white hover:cursor-pointer hover:text-black bg-red-400  p-1.5 rounded-sm"
            onClick={() => openDeleteModal(faq._id)}
          />
        </div>
      ),
    })) || [];

  const tableHeader = [
    { name: t("table.question"), key: "question", important: true },
    { name: t("table.answer"), key: "answer" },
    { component: <GoPencil className="text-center text-lg" />, key: "edit" },
    { component: <IoIosTrash className="text-center text-lg" />, key: "erase" },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: t("header.new"),
        onClick: openCreateModal,
      },
    ],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder={t("page.searchPlaceholder")}
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
                aria-label={t("page.clearSearch")}
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: t("page.results", { count: data?.total || 0 }),
  };

  if (isQueryLoading && faqs.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{t("page.errorLoadingFaqs")}</div>;
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "MARKETING"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("page.faqsTitle")}</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        {/* Element for infinite scroll */}
        <div ref={observerRef} className="h-10" />
      </div>

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
    </PrivateRoute>
  );
};

export default Page;
