"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { FaPlus, FaTimes } from "react-icons/fa";
import { AiFillFileExcel } from "react-icons/ai";
import { IoSync } from "react-icons/io5";
import { useGetArticlesTechnicalDetailsQuery } from "@/redux/services/articlesTechnicalDetailsApi";
import {
  useGetAllArticlesQuery,
  useSyncEquivalencesMutation,
} from "@/redux/services/articlesApi";
import CreateArticlesTechnicalDetailsModal from "./CreateArticleTD";
import ImportArticlesTDModal from "./ImportExcel";
import ExportArticlesTDModal from "./ExportExcel";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data: articlesData } = useGetAllArticlesQuery(null);
  // Expecting useGetArticlesTechnicalDetailsQuery to return { technical_details, total }
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetArticlesTechnicalDetailsQuery(
    {
      page,
      limit,
      query: searchQuery,
    },
    {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );
  const [syncEquivalences, { isLoading: isLoadingSync }] =
    useSyncEquivalencesMutation();

  // Load data and update items and total
  useEffect(() => {
    if (data?.technical_details) {
      setItems((prev) => {
        if (page === 1) {
          return data.technical_details;
        }
        const newArticles = data.technical_details.filter(
          (article) => !prev.some((item) => item.id === article.id)
        );
        return [...prev, ...newArticles];
      });
      setHasMore(data.technical_details.length === ITEMS_PER_PAGE);
    }
  }, [data?.technical_details, page]);

  // ======================================================
  // Infinite Scroll (Intersection Observer)
  // ======================================================
  const lastArticleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isQueryLoading) {
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.0, rootMargin: "200px" } // Se dispara 200px antes de que el sentinel esté visible
      );

      if (node) observerRef.current.observe(node);
    },
    [hasMore, isQueryLoading]
  );

  // Reset search handler
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setItems([]);
  };

  // Modal handlers
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setPage(1);
    setItems([]);
    refetch();
  };

  const openImportModal = () => setImportModalOpen(true);
  const closeImportModal = () => {
    setImportModalOpen(false);
    setPage(1);
    setItems([]);
    refetch();
  };

  const openExportModal = () => setExportModalOpen(true);
  const closeExportModal = () => {
    setExportModalOpen(false);
    setPage(1);
    setItems([]);
    refetch();
  };

  const handleSyncEquivalences = async () => {
    try {
      await syncEquivalences().unwrap();
    } catch (error) {
      console.error(t("errorSyncEquivalences"), error);
    }
  };

  // Map each technical detail to a table row object
  const tableData = items?.map((item) => {
    return {
      article: item?.article_id || t("notFound"),
      technical_detail_name: item?.technical_detail?.name || t("notFound"),
      value: item?.value,
    };
  });

  const tableHeader = [
    { name: t("article"), key: "article", important: true, sortable: true },
    {
      name: t("technicalDetail"),
      key: "technical_detail_name",
      important: true,
    },
    { name: t("value"), key: "value", important: true },
  ];

  // Header configuration with buttons, filters, and results
  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: t("new"), onClick: openCreateModal },
      {
        logo: <AiFillFileExcel />,
        title: t("importExcel"),
        onClick: openImportModal,
      },
      {
        logo: <AiFillFileExcel />,
        title: t("exportExcel"),
        onClick: openExportModal,
      },
      {
        logo: <IoSync />,
        title: t("syncEquivalences"),
        onClick: handleSyncEquivalences,
      },
    ],
    filters: [
      {
        content: (
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                setPage(1);
                setItems([]);
                refetch();
              }
            }}
          />
        ),
      },
    ],
    results: t("results", { count: data?.total || 0 }),
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-red-500">
        {t("errorLoadingTechnicalDetails")}
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("articlesTechnicalDetails")}</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <div ref={lastArticleRef} className="h-10" />
        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateArticlesTechnicalDetailsModal closeModal={closeCreateModal} />
        </Modal>
        <Modal isOpen={isImportModalOpen} onClose={closeImportModal}>
          <ImportArticlesTDModal closeModal={closeImportModal} />
        </Modal>
        <Modal isOpen={isExportModalOpen} onClose={closeExportModal}>
          <ExportArticlesTDModal closeModal={closeExportModal} />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
