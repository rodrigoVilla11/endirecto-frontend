"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { FaEdit, FaPlus, FaTimes } from "react-icons/fa";
import { AiFillFileExcel } from "react-icons/ai";
import { IoSync } from "react-icons/io5";
import {
  useGetArticlesTechnicalDetailsQuery,
  useUpdateArticleTechnicalDetailMutation,
} from "@/redux/services/articlesTechnicalDetailsApi";
import {
  useGetAllArticlesQuery,
  useSyncEquivalencesMutation,
} from "@/redux/services/articlesApi";
import CreateArticlesTechnicalDetailsModal from "./CreateArticleTD";
import ImportArticlesTDModal from "./ImportExcel";
import ExportArticlesTDModal from "./ExportExcel";
import { useTranslation } from "react-i18next";
import { IoMdClose } from "react-icons/io";
import { useGetAllTechnicalDetailQuery } from "@/redux/services/technicalDetails";
import ExportTechnicalDetailsModal from "./ExportExcel";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(""); // Nuevo estado para debounce
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedTechnical, setSelectedTechnical] = useState<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref para el timeout

  const { data: articlesData } = useGetAllArticlesQuery(null);

  // Usar debouncedSearchQuery en lugar de searchQuery
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetArticlesTechnicalDetailsQuery(
    {
      page,
      limit,
      query: debouncedSearchQuery, // Cambio aquí
    },
    {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [syncEquivalences, { isLoading: isLoadingSync }] =
    useSyncEquivalencesMutation();

  // Debounce para el searchQuery
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (debouncedSearchQuery !== searchQuery) {
        setDebouncedSearchQuery(searchQuery);
        setPage(1); // Reset página
        setItems([]); // Reset items
      }
    }, 300); // 300ms de debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, debouncedSearchQuery]);

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
        { threshold: 0.0, rootMargin: "200px" }
      );

      if (node) observerRef.current.observe(node);
    },
    [hasMore, isQueryLoading]
  );

  // Reset search handler mejorado
  const handleResetSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, []);

  // Search input handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Enter key handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Forzar búsqueda inmediata
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
      setItems([]);
    }
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
      actions: (
        <button
          onClick={() => handleEdit(item)}
          className="text-blue-500 hover:text-blue-700"
        >
          <FaEdit />
        </button>
      ),
    };
  });

  const handleEdit = (item: any) => {
    setSelectedTechnical(item);
    setEditModalOpen(true);
  };

  const [updateArticleTechnicalDetail] =
    useUpdateArticleTechnicalDetailMutation();
  const handleUpdate = async (data: any) => {
    await updateArticleTechnicalDetail(data);
    refetch();
    setEditModalOpen(false);
  };

  const tableHeader = [
    { name: t("article"), key: "article", important: true, sortable: true },
    {
      name: t("technicalDetail"),
      key: "technical_detail_name",
      important: true,
    },
    { name: t("value"), key: "value", important: true },
    { name: t("actions"), key: "actions", important: true },
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
          <div className="relative">
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
            {searchQuery && (
              <button
                onClick={handleResetSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: t("results", { count: data?.total || 0 }),
  };

  // Loading state mejorado
  if (isQueryLoading && items.length === 0) {
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

        {/* Loading indicator para infinite scroll */}
        {isQueryLoading && items.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        )}

        {/* Sentinel para infinite scroll */}
        {hasMore && <div ref={lastArticleRef} className="h-10" />}

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateArticlesTechnicalDetailsModal closeModal={closeCreateModal} />
        </Modal>
        <Modal isOpen={isImportModalOpen} onClose={closeImportModal}>
          <ImportArticlesTDModal closeModal={closeImportModal} />
        </Modal>
        <Modal isOpen={isExportModalOpen} onClose={closeExportModal}>
          <ExportTechnicalDetailsModal
            closeModal={closeExportModal}
            searchQuery={searchQuery}
          />
        </Modal>
        <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
          <EditArticleTechnicalDetailComponent
            technical={selectedTechnical}
            onUpdate={handleUpdate}
            onCancel={() => setEditModalOpen(false)}
          />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;

type EditArticleTechnicalDetailProps = {
  technical: {
    id: string;
    article_id: string;
    technical_detail_id: string;
    value: string;
  };
  onUpdate: (data: {
    id: string;
    article_id: string;
    technical_detail_id: string;
    value: string;
  }) => void;
  onCancel: () => void;
};

const EditArticleTechnicalDetailComponent: React.FC<
  EditArticleTechnicalDetailProps
> = ({ technical, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    article_id: technical?.article_id || "",
    technical_detail_id: technical?.technical_detail_id || "",
    value: technical?.value || "",
  });

  const {
    data: technicalDetails,
    isLoading: isLoadingTechnicalDetails,
    isError: isErrorTechnicalDetails,
  } = useGetAllTechnicalDetailQuery(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ id: technical.id, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold mb-4">Editar Detalle Técnico</h2>
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-1 right-1 bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
        >
          <IoMdClose className="text-sm" />
        </button>
      </div>

      <div className="mb-2">
        <label className="block mb-1">Article ID:</label>
        <input
          type="text"
          name="article_id"
          value={formData.article_id}
          onChange={handleChange}
          className="w-full border p-1"
        />
      </div>

      <div className="mb-2">
        <label className="block mb-1">Detalle Técnico:</label>
        {isLoadingTechnicalDetails ? (
          <p>Cargando detalles técnicos...</p>
        ) : isErrorTechnicalDetails ? (
          <p className="text-red-500">Error al cargar detalles</p>
        ) : (
          <select
            name="technical_detail_id"
            value={formData.technical_detail_id}
            onChange={handleChange}
            className="w-full border p-1"
          >
            <option value="">Seleccione un detalle...</option>
            {technicalDetails?.map((detail: any) => (
              <option key={detail.id} value={detail.id}>
                {detail.name || detail.code || detail.id}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-2">
        <label className="block mb-1">Valor:</label>
        <input
          type="text"
          name="value"
          value={formData.value}
          onChange={handleChange}
          className="w-full border p-1"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Actualizar
      </button>
    </form>
  );
};
