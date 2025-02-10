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

const ITEMS_PER_PAGE = 15;

const Page = () => {
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
        newSortQuery = currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
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
  const tableData = applicationsOfArticles?.map((item) => {
    const article = articlesData?.find((data) => data.id === item.article_id);
    return {
      key: `${item.article_id}-${item.brand}-${item.model}-${item.year}`,
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
      article: article?.name || "Not found",
      brand: item?.brand || "Not found",
      model: item?.model || "Not found",
      engine: item?.engine || "Not found",
      year: item?.year || "Not found",
    };
  });

  const tableHeader = [
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Article", key: "article" },
    { name: "Brand", key: "brand" },
    { name: "Model", key: "model" },
    { name: "Engine", key: "engine" },
    { name: "Year", key: "year" },
  ];

  // Configuración del header (botones, filtros y resultados)
  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: "New", onClick: openCreateModal },
      { logo: <AiFillFileExcel />, title: "Import Excel", onClick: openImportModal },
      { logo: <AiFillFileExcel />, title: "Export Excel", onClick: openExportModal },
      { logo: <IoSync />, title: "Sync Application of Articles", onClick: handleSyncEquivalences },
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
    results: `${data?.total || 0} Results`,
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
        Error loading applications. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold p-4">APPLICATION OF ARTICLES</h3>
        <Header headerBody={headerBody} />

        {isLoading && applicationsOfArticles.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : applicationsOfArticles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No applications found
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
