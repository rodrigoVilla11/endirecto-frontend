"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa6";
import { FaPlus, FaTimes } from "react-icons/fa";
import { useGetArticlesEquivalencesQuery } from "@/redux/services/articlesEquivalences";
import {
  useGetAllArticlesQuery,
  useSyncEquivalencesMutation,
} from "@/redux/services/articlesApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { AiFillFileExcel } from "react-icons/ai";
import CreateArticlesEquivalencesModal from "./CreateEquivalence";
import ImportExcelModal from "../application-of-articles/ImportExcel";
import ExportExcelModal from "../application-of-articles/ExportExcelButton";
import { IoSync } from "react-icons/io5";

const Page = () => {
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
          // Aseguramos que result.data tenga la forma esperada:
          // { equivalences: ArticleEquivalence[], total: number }
          const fetchedData = result.data || { equivalences: [], total: 0 };
          const newEquivalences = Array.isArray(fetchedData.equivalences)
            ? fetchedData.equivalences
            : [];
          // Actualizamos el total devuelto por el servicio
          setTotalEquivalences(fetchedData.total || 0);
          // Si es la primera página se reemplaza el array, de lo contrario se concatena
          setEquivalences((prev) =>
            page === 1 ? newEquivalences : [...prev, ...newEquivalences]
          );
        })
        .catch((error) => {
          console.error("Error fetching equivalences:", error);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [page, refetch, isFetching, searchQuery]);

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
      console.error("Error al sincronizar equivalences:", error);
    }
  };

  // Configuración de la tabla: mapeamos cada equivalence a un objeto para la tabla
  const tableData = equivalences?.map((item) => {
    // Normalizamos para evitar problemas de espacios o mayúsculas
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
            <span className="text-gray-400">No image</span>
          )}
        </div>
      ),
      article: article?.name || "NOT FOUND",
      brand: item?.brand || "Not found",
      code: item?.code || "Not found",
    };
  });
  

  const tableHeader = [
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Article", key: "article",  important:true },
    { name: "Brand", key: "brand",  important:true },
    { name: "Code", key: "code", important:true },
  ];

  // Configuración del header con botones, filtros y resultados
  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: "New", onClick: openCreateModal },
      { logo: <AiFillFileExcel />, title: "Import Excel", onClick: openImportModal },
      { logo: <AiFillFileExcel />, title: "Export Excel", onClick: openExportModal },
      { logo: <IoSync />, title: "Sync Equivalences", onClick: handleSyncEquivalences },
    ],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder="Search..."
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
                aria-label="Clear search"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: `${totalEquivalences || 0} Results`,
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
        Error loading equivalences. Please try again later.
      </div>
    );
  }

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
