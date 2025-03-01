"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa6";
import { FaPlus, FaTimes } from "react-icons/fa";
import {
  useGetArticlesVehiclesPagQuery,
  useCountArticleVehicleQuery,
} from "@/redux/services/articlesVehicles";
import {
  useGetAllArticlesQuery,
  useSyncArticleVehiclesMutation,
} from "@/redux/services/articlesApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";
import { AiFillFileExcel } from "react-icons/ai";
import Modal from "@/app/components/components/Modal";
import CreateArticleVehicleComponent from "./CreateAoA";
import ImportExcelModal from "./ImportExcel";
import ExportExcelButton from "./ExportExcelButton";
import { IoSync } from "react-icons/io5";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [applicationsOfArticles, setApplicationsOfArticles] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  // Referencias para infinite scroll
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux
  const { data: articlesData } = useGetAllArticlesQuery(null);
  // Se espera que useGetArticlesVehiclesPagQuery retorne un objeto con { vehicles, totalVehicles }
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetArticlesVehiclesPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortQuery,
  });
  const [
    syncArticleVehicles,
    { isLoading: isLoadingSync, isSuccess, isError },
  ] = useSyncArticleVehiclesMutation();

  const handleSyncEquivalences = async () => {
    try {
      await syncArticleVehicles().unwrap();
    } catch (error) {
      console.error("Error al sincronizar equivalencias:", error);
    }
  };

  // Debounced search para optimizar cambios en la búsqueda
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setPage(1);
      setApplicationsOfArticles([]);
      setHasMore(true);
    }, 100),
    []
  );

  // Efecto para cargar los artículos (infinite scroll y búsquedas)
  useEffect(() => {
    const loadApplications = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          // Se espera que el resultado tenga la forma { vehicles, totalVehicles }
          const result = await refetch().unwrap();
          const newApplications = result.vehicles || [];
          if (page === 1) {
            setApplicationsOfArticles(newApplications);
          } else {
            setApplicationsOfArticles((prev) => [...prev, ...newApplications]);
          }
          setHasMore(newApplications.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading applications:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadApplications();
  }, [page, searchQuery, sortQuery, refetch, isLoading]);

  // Intersection Observer para el infinite scroll
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

  // Reset de búsqueda
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setApplicationsOfArticles([]);
    setHasMore(true);
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

  // Handler para ordenamiento
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSortQuery = "";
      if (currentField === field) {
        newSortQuery =
          currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
        newSortQuery = `${field}:asc`;
      }
      setSortQuery(newSortQuery);
      setPage(1);
      setApplicationsOfArticles([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  // Configuración de la tabla
  const tableData = applicationsOfArticles?.map((item, index) => {
    const article = articlesData?.find((data) => data.id === item.article_id);
    return {
      key: `${index}`,
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
      article: article?.name || t("notFound", { defaultValue: "Not found" }),
      brand: item?.brand || t("notFound", { defaultValue: "Not found" }),
      model: item?.model || t("notFound", { defaultValue: "Not found" }),
      engine: item?.engine || t("notFound", { defaultValue: "Not found" }),
      year: item?.year || t("notFound", { defaultValue: "Not found" }),
    };
  });

  const tableHeader = [
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: t("article"), key: "article", important: true },
    { name: t("brand"), key: "brand", important: true },
    { name: t("model"), key: "model", important: true },
    { name: t("engine"), key: "engine", important: true },
    { name: t("year"), key: "year", important: true },
  ];

  // Configuración del header (botones, filtros y resultados)
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
        title: t("syncApplications"),
        onClick: handleSyncEquivalences,
      },
    ],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder={t("searchPlaceholder")}
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
                aria-label={t("clearSearch")}
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: t("results", { count: data?.total || 0 }),
  };

  if (isQueryLoading && applicationsOfArticles.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {t("errorLoading")}
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold p-4">{t("applicationOfArticles")}</h3>
        <Header headerBody={headerBody} />

        {isLoading && applicationsOfArticles.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : applicationsOfArticles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("noApplicationsFound")}
          </div>
        ) : (
          <>
            <Table
              headers={tableHeader}
              data={tableData}
              onSort={handleSort}
              sortField={sortQuery.split(":")[0]}
              sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
            />
            {isLoading && (
              <div ref={loadingRef} className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}

        {/* Elemento observador para infinite scroll */}
        <div ref={observerRef} className="h-10" />

        {/* Modales */}
        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateArticleVehicleComponent closeModal={closeCreateModal} />
        </Modal>
        <Modal isOpen={isImportModalOpen} onClose={closeImportModal}>
          <ImportExcelModal closeModal={closeImportModal} />
        </Modal>
        <Modal isOpen={isExportModalOpen} onClose={closeExportModal}>
          <ExportExcelButton closeModal={closeExportModal} />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
