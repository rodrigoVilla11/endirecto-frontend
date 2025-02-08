"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { FaPlus } from "react-icons/fa";
import { AiFillFileExcel } from "react-icons/ai";
import { useGetArticlesTechnicalDetailsQuery } from "@/redux/services/articlesTechnicalDetailsApi";
import CreateArticlesTechnicalDetailsModal from "./CreateArticleTD";
import ExportArticlesTDModal from "./ExportExcel";
import ImportArticlesTDModal from "./ImportExcel";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);


  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data, error, isLoading, refetch } = useGetArticlesTechnicalDetailsQuery({
    page,
    limit,
    query: searchQuery,
  });

  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          const newItems = result.data || []; // Garantiza que siempre sea un array
          setItems((prev) => [...prev, ...newItems]);
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

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  const openImportModal = () => setImportModalOpen(true);
  const closeImportModal = () => {
    setImportModalOpen(false);
    refetch();
  };

  const openExportModal = () => setExportModalOpen(true);
  const closeExportModal = () => {
    setExportModalOpen(false);
    refetch();
  };


  const tableData = items?.map((item) => {

    return {
      article: item?.article_id || "NOT FOUND",
      brand: item?.technical_detail.name,
      value: item?.value,
    };
  });

  const tableHeader = [
    { name: "Article", key: "article" },
    { name: "Technical Detail", key: "technical_detail_name" },
    { name: "Value", key: "value" },
  ];
  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: "New", onClick: openCreateModal },
      {
        logo: <AiFillFileExcel />,
        title: "Import Excel",
        onClick: openImportModal,
      },
      {
        logo: <AiFillFileExcel />,
        title: "Export Excel",
        onClick: openExportModal,
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
    results: `${items?.length || 0} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">Articles Technical Details</h3>
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
