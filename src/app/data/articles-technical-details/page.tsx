"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { FaPlus, FaTimes } from "react-icons/fa";
import { AiFillFileExcel } from "react-icons/ai";
import { IoSync } from "react-icons/io5";
import { useGetArticlesTechnicalDetailsQuery } from "@/redux/services/articlesTechnicalDetailsApi";
import { useGetAllArticlesQuery, useSyncEquivalencesMutation } from "@/redux/services/articlesApi";
import CreateArticlesTechnicalDetailsModal from "./CreateArticleTD";
import ImportArticlesTDModal from "./ImportExcel";
import ExportArticlesTDModal from "./ExportExcel";
import { useTranslation } from "react-i18next";

const Page = () => {
  const { t } = useTranslation();
  
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [totalEquivalences, setTotalEquivalences] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data: articlesData } = useGetAllArticlesQuery(null);
  // Expecting useGetArticlesTechnicalDetailsQuery to return { technical_details, total }
  const { data, error, isLoading, refetch } = useGetArticlesTechnicalDetailsQuery({
    page,
    limit,
    query: searchQuery,
  });
  const [syncEquivalences, { isLoading: isLoadingSync }] = useSyncEquivalencesMutation();

  // Load data and update items and total
  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          const fetchedData = result.data || { technical_details: [], total: 0 };
          const newItems = Array.isArray(fetchedData.technical_details)
            ? fetchedData.technical_details
            : [];
          setTotalEquivalences(fetchedData.total || 0);
          setItems((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
        })
        .catch((error) => {
          console.error(t("errorFetchingTechnicalDetails"), error);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [page, searchQuery, refetch, isFetching, t]);

  // Intersection Observer for infinite scroll
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
    { name: t("technicalDetail"), key: "technical_detail_name", important: true },
    { name: t("value"), key: "value", important: true },
  ];

  // Header configuration with buttons, filters, and results
  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: t("new"), onClick: openCreateModal },
      { logo: <AiFillFileExcel />, title: t("importExcel"), onClick: openImportModal },
      { logo: <AiFillFileExcel />, title: t("exportExcel"), onClick: openExportModal },
      { logo: <IoSync />, title: t("syncEquivalences"), onClick: handleSyncEquivalences },
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
    results: t("results", { count: totalEquivalences || 0 }),
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
        <div ref={observerRef} className="h-10" />
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
