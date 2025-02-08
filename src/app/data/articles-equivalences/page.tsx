"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa6";
import {
  useCountArticleVehicleQuery,
  useGetArticlesVehiclesPagQuery,
} from "@/redux/services/articlesVehicles";
import {
  useGetAllArticlesQuery,
  useGetArticlesQuery,
  useSyncEquivalencesMutation,
} from "@/redux/services/articlesApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useGetArticlesEquivalencesQuery } from "@/redux/services/articlesEquivalences";
import Modal from "@/app/components/components/Modal";
import { FaPlus } from "react-icons/fa";
import { AiFillFileExcel } from "react-icons/ai";
import CreateArticlesEquivalencesModal from "./CreateEquivalence";
import ImportExcelModal from "../application-of-articles/ImportExcel";
import ExportExcelModal from "../application-of-articles/ExportExcelButton";
import { IoSync } from "react-icons/io5";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  // const { data: countArticleVehicleData } = useCountArticleVehicleQuery(null);
  const [equivalences, setEquivalences] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [syncEquivalences, { isLoading: isLoadingSync, isSuccess, isError }] =
    useSyncEquivalencesMutation();

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data: articlesData } = useGetAllArticlesQuery(null);
  const { data, error, isLoading, refetch } = useGetArticlesEquivalencesQuery({
    page,
    limit,
    query: searchQuery,
  });

  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          const newBrands = result.data || []; // Garantiza que siempre sea un array
          setEquivalences((prev) => [...prev, ...newBrands]);
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

  const handleSyncEquivalences = async () => {
    try {
      const response = await syncEquivalences().unwrap();
    } catch (error) {
      console.error("Error al sincronizar equivalencias:", error);
    }
  };

  const tableData = equivalences?.map((item) => {
    const article = articlesData?.find((data) => data.id == item.article_id);

    return {
      image: (
        <div className="flex justify-center items-center">
          {article?.images ? (
            <img
              src={article.images[0]}
              alt={article.name}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="text-gray-400">No image</span>
          )}
        </div>
      ),
      article: article?.name || "NOT FOUND",
      brand: item?.brand,
      code: item?.code,
    };
  });

  const tableHeader = [
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Article", key: "article" },
    { name: "Brand", key: "brand" },
    { name: "Code", key: "code" },
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
      {
        logo: <IoSync />,
        title: "Sync Equivalences",
        onClick: handleSyncEquivalences,
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
    results: `${equivalences?.length || 0} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">ARTICLES EQUIVALENCES</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <div ref={observerRef} className="h-10" />

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateArticlesEquivalencesModal closeModal={closeCreateModal} />
        </Modal>
        <Modal isOpen={isImportModalOpen} onClose={closeImportModal}>
          <ImportExcelModal closeModal={closeImportModal} />
        </Modal>
        <Modal isOpen={isExportModalOpen} onClose={closeExportModal}>
          <ExportExcelModal closeModal={closeExportModal} />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
