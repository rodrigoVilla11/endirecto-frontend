"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import {
  useGetSearchesPagQuery,
  useDeleteSearchMutation,
} from "@/redux/services/searchesApi";
import { useTranslation } from "react-i18next";
import { AiFillFileExcel } from "react-icons/ai";
import Modal from "@/app/components/components/Modal";
import ExportExcelModal from "./ExportExcelButton";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados principales
  const [page, setPage] = useState(1);
  const [limit] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Modal de confirmación para eliminar
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  const [searchToDelete, setSearchToDelete] = useState<any>(null);

  // RTK Query: Obtener búsquedas paginadas
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetSearchesPagQuery(
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

  // RTK Query: Mutación para eliminar búsqueda
  const [deleteSearchMutation] = useDeleteSearchMutation();

  // Ref para el Intersection Observer (infinite scroll)
  const observerRef = useRef<IntersectionObserver | null>(null);

  const openExportModal = () => setExportModalOpen(true);
  const closeExportModal = () => {
    setExportModalOpen(false);
  };

  // Actualizar lista de artículos y evitar duplicados
  useEffect(() => {
    if (data?.searches) {
      setItems((prev) => {
        if (page === 1) {
          return data.searches;
        }
        // Evitar duplicados
        const newSearches = data.searches.filter(
          (search) => !prev.some((item: any) => item._id === search._id)
        );
        return [...prev, ...newSearches];
      });
      setHasMore(data.searches.length === ITEMS_PER_PAGE);
    }
  }, [data?.searches, page]);

  // Intersection Observer para cargar más datos al hacer scroll
  const lastArticleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isQueryLoading) {
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.0, rootMargin: "200px" }
      );

      if (node) observerRef.current.observe(node);
    },
    [hasMore, isQueryLoading]
  );

  // Manejo de eliminación
  const handleOpenDeleteModal = (search: any) => {
    setSearchToDelete(search);
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setSearchToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!searchToDelete) return;
    try {
      await deleteSearchMutation(searchToDelete._id).unwrap();
      // Removemos del estado local
      setItems((prev) =>
        prev.filter((item) => item._id !== searchToDelete._id)
      );
      setIsDeleteModalOpen(false);
      setSearchToDelete(null);
      // Opcional: si prefieres, puedes hacer un refetch en lugar de manipular el estado
      // refetch();
    } catch (err) {
      console.error("Error deleting search:", err);
    }
  };

  // Mapeamos los searches para la tabla
  const tableData = Array.isArray(items)
    ? items.map((search) => ({
        key: search._id,
        search: search.search,
        quantity: search.quantity,
        // Botón para eliminar
        deleteAction: (
          <button
            onClick={() => handleOpenDeleteModal(search)}
            className="px-2 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50 text-xs"
          >
            {t("common.delete")}
          </button>
        ),
      }))
    : [];

  // Definir encabezados de la tabla (agregamos columna de acciones)
  const tableHeader = [
    { name: t("table.search"), key: "search", important: true },
    { name: t("table.quantity"), key: "quantity" },
    { name: t("table.actions"), key: "deleteAction" },
  ];

  // Configuración del header
  const headerBody = {
    buttons: [
      {
        logo: <AiFillFileExcel />,
        title: t("exportExcel"),
        onClick: openExportModal,
      },
    ],
    filters: [
      {
        content: (
          <Input
            placeholder={t("page.searchPlaceholder")}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              // Reiniciamos la página al cambiar la búsqueda
              setPage(1);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                setPage(1);
                refetch();
              }
            }}
          />
        ),
      },
    ],
    results: searchQuery
      ? t("page.results", { count: items.length })
      : t("page.results", { count: data?.total || items.length }),
  };

  if (isQueryLoading && page === 1) return <p>{t("page.loading")}</p>;

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("page.searchesTitle")}</h3>
        <Header headerBody={headerBody} />

        <Table headers={tableHeader} data={tableData} />

        {/* Sentinel para el infinite scroll */}
        <div ref={lastArticleRef} className="h-10" />

        <Modal isOpen={isExportModalOpen} onClose={closeExportModal}>
          <ExportExcelModal
            closeModal={closeExportModal}
            searchQuery={searchQuery}
          />
        </Modal>

        {/* Modal de confirmación para eliminar */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded shadow-md w-full max-w-sm mx-auto">
              <p className="mb-4 text-gray-800 text-sm">
                {t("page.confirmDeleteMessage")}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelDelete}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PrivateRoute>
  );
};

export default Page;
