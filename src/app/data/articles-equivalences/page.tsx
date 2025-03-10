"use client";
import React, { useState, useEffect, useRef } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPlus, FaTimes } from "react-icons/fa";
import { useGetArticlesEquivalencesQuery } from "@/redux/services/articlesEquivalences";
import { useGetAllArticlesQuery, useSyncEquivalencesMutation } from "@/redux/services/articlesApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { AiFillFileExcel } from "react-icons/ai";
import CreateArticlesEquivalencesModal from "./CreateEquivalence";
import ImportExcelModal from "../application-of-articles/ImportExcel";
import ExportExcelModal from "../application-of-articles/ExportExcelButton";
import { IoSync } from "react-icons/io5";
import { useTranslation } from "react-i18next";

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [equivalences, setEquivalences] = useState<any[]>([]);
  const [totalEquivalences, setTotalEquivalences] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);

  const [syncEquivalences, { isLoading: isLoadingSync, isSuccess, isError }] =
    useSyncEquivalencesMutation();

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  // Referencia para el IntersectionObserver (infinite scroll)
  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data: articlesData } = useGetAllArticlesQuery(null);
  // Se espera que useGetArticlesEquivalencesQuery retorne { equivalences, total }
  const { data, error, isLoading, refetch } = useGetArticlesEquivalencesQuery({
    page,
    limit,
    query: searchQuery,
  });

  // Efecto para cargar equivalences (incluye infinite scroll y búsqueda)
  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          const fetchedData = result.data || { equivalences: [], total: 0 };
          const newEquivalences = Array.isArray(fetchedData.equivalences)
            ? fetchedData.equivalences
            : [];
          setTotalEquivalences(fetchedData.total || 0);
          setEquivalences((prev) =>
            page === 1 ? newEquivalences : [...prev, ...newEquivalences]
          );
        })
        .catch((error) => {
          console.error(t("errorLoadingEquivalences"), error);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [page, refetch, isFetching, searchQuery, t]);

  // Intersection Observer para el infinite scroll
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

  // Handler para resetear la búsqueda
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setEquivalences([]);
  };

  // Handlers de modales
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
      await syncEquivalences().unwrap();
    } catch (error) {
      console.error(t("errorSyncEquivalences"), error);
    }
  };

  // Configuración de la tabla: mapeamos cada equivalence a un objeto para la tabla
  const tableData = equivalences?.map((item) => {
    const article = articlesData?.find((data) =>
      data.id.trim().toLowerCase() === item.article_id.trim().toLowerCase()
    );
    
    return {
      key: `${item.article_id}-${item.brand}-${item.code}`,
      image: (
        <div className="flex justify-center items-center">
          {article?.images ? (
            <img
              src={article.images[0]}
              alt={article.name}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="text-gray-400">{t("noImage")}</span>
          )}
        </div>
      ),
      article: article?.supplier_code || t("notFound"),
      brand: item?.brand || t("notFound"),
      code: item?.code || t("notFound"),
    };
  });
  

  const tableHeader = [
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: t("article"), key: "article", important: true, sortable: true  },
    { name: t("brand"), key: "brand", important: true , sortable: true },
    { name: t("code"), key: "code", important: true },
  ];

  // Configuración del header con botones, filtros y resultados
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
          <div className="relative">
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setEquivalences([]);
                  refetch();
                }
              }}
              className="pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleResetSearch}
                aria-label={t("clearSearch")}
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: t("results", { count: totalEquivalences || 0 }),
  };

  if (isLoading && equivalences.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {t("errorLoadingEquivalences")}
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold pt-4 px-4">{t("articlesEquivalences")}</h3>
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
