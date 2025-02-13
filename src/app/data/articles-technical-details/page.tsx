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
import {
  useGetAllArticlesQuery,
  useSyncEquivalencesMutation,
} from "@/redux/services/articlesApi";
import CreateArticlesTechnicalDetailsModal from "./CreateArticleTD";
import ImportArticlesTDModal from "./ImportExcel";
import ExportArticlesTDModal from "./ExportExcel";

const Page = () => {
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
  // Se espera que useGetArticlesTechnicalDetailsQuery retorne { technicalDetails, total }
  const { data, error, isLoading, refetch } = useGetArticlesTechnicalDetailsQuery({
    page,
    limit,
    query: searchQuery,
  });
  const [syncEquivalences, { isLoading: isLoadingSync }] = useSyncEquivalencesMutation();

  // Efecto para cargar la data y actualizar items y total
  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          // result.data debería tener la forma:
          // { technicalDetails: ArticlesTechnicalDetails[], total: number }
          const fetchedData = result.data || { technical_details: [], total: 0 };
          const newItems = Array.isArray(fetchedData.technical_details)
            ? fetchedData.technical_details
            : [];
          setTotalEquivalences(fetchedData.total || 0);
          // Si es la primera página, reemplazamos; si no, concatenamos
          setItems((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
        })
        .catch((error) => {
          console.error("Error fetching technical details:", error);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [page, searchQuery, refetch, isFetching]);

  // Intersection Observer para infinite scroll
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
    setItems([]);
  };

  // Handlers de modales
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
      console.error("Error al sincronizar equivalences:", error);
    }
  };

  // Configuración de la tabla: mapeamos cada technical detail a un objeto para la tabla.
  const tableData = items?.map((item) => {
    return {
      article: item?.article_id || "NOT FOUND",
      technical_detail_name: item?.technical_detail?.name || "NOT FOUND",
      value: item?.value,
    };
  });

  const tableHeader = [
    { name: "Article", key: "article",  important:true },
    { name: "Technical Detail", key: "technical_detail_name", important:true },
    { name: "Value", key: "value", important:true },
  ];

  // Configuración del header: botones, filtros y resultados (usando el total devuelto por el servicio)
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
          <Input
            placeholder="Search..."
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
    results: `${totalEquivalences || 0} Results`,
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
        Error loading technical details. Please try again later.
      </div>
    );
  }

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
