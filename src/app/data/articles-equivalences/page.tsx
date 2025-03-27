"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPlus, FaTimes, FaEdit } from "react-icons/fa";
import {
  useGetArticlesEquivalencesQuery,
  useUpdateArticleEquivalenceMutation,
} from "@/redux/services/articlesEquivalences";
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
import { useTranslation } from "react-i18next";
import { IoMdClose } from "react-icons/io";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [equivalences, setEquivalences] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [syncEquivalences, { isLoading: isLoadingSync, isSuccess, isError }] =
    useSyncEquivalencesMutation();

  // Estados y handler para edición
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedEquivalence, setSelectedEquivalence] = useState<any>(null);

  // Referencia para el IntersectionObserver (infinite scroll)
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data: articlesData } = useGetAllArticlesQuery(null);
  // Se espera que useGetArticlesEquivalencesQuery retorne { equivalences, total }
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetArticlesEquivalencesQuery(
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

  useEffect(() => {
    if (data?.equivalences) {
      setEquivalences((prev) => {
        if (page === 1) {
          return data.equivalences;
        }
        const newEquivalences = data.equivalences.filter(
          (equivalence) => !prev.some((item) => item.id === equivalence.id)
        );
        return [...prev, ...newEquivalences];
      });
      setHasMore(data.equivalences.length === ITEMS_PER_PAGE);
    }
  }, [data?.equivalences, page]);

  // ======================================================
  // Infinite Scroll (Intersection Observer)
  // ======================================================
  const lastEquivalenceRef = useCallback(
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

  // Handler para abrir el modal de edición
  const handleEditEquivalence = (equivalence: any) => {
    setSelectedEquivalence(equivalence);
    setEditModalOpen(true);
  };

  // Configuración de la tabla: mapeamos cada equivalence a un objeto para la tabla
  const tableData = equivalences?.map((item) => {
    const article = articlesData?.find(
      (data) =>
        data.id.trim().toLowerCase() === item.article_id.trim().toLowerCase()
    );

    return {
      key: `${item.article_id}-${item.brand}-${item.code}`,
      article: article?.supplier_code || t("notFound"),
      brand: item?.brand || t("notFound"),
      code: item?.code || t("notFound"),
      actions: (
        <button
          onClick={() => handleEditEquivalence(item)}
          title={t("edit")}
          className="text-blue-500 hover:text-blue-700"
        >
          <FaEdit />
        </button>
      ),
    };
  });

  const tableHeader = [
    { name: t("article"), key: "article", important: true, sortable: true },
    { name: t("brand"), key: "brand", important: true, sortable: true },
    { name: t("code"), key: "code", important: true },
    { name: t("actions"), key: "actions", important: false },
  ];

  // Configuración del header con botones, filtros y resultados
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
    results: t("results", { count: data?.total || 0 }),
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
      <div className="p-4 text-red-500">{t("errorLoadingEquivalences")}</div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold pt-4 px-4">{t("articlesEquivalences")}</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <div ref={lastEquivalenceRef} className="h-10" />
        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateArticlesEquivalencesModal closeModal={closeCreateModal} />
        </Modal>
        <Modal isOpen={isImportModalOpen} onClose={closeImportModal}>
          <ImportExcelModal closeModal={closeImportModal} />
        </Modal>
        <Modal isOpen={isExportModalOpen} onClose={closeExportModal}>
          <ExportExcelModal closeModal={closeExportModal} />
        </Modal>
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            refetch();
          }}
        >
          <EditArticleEquivalenceComponent
            equivalence={selectedEquivalence}
            closeModal={() => {
              setEditModalOpen(false);
              refetch();
            }}
          />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;

// Componente para editar una equivalencia de artículo
type EditArticleEquivalenceComponentProps = {
  equivalence: any;
  closeModal: () => void;
};

const EditArticleEquivalenceComponent: React.FC<
  EditArticleEquivalenceComponentProps
> = ({ equivalence, closeModal }) => {
  const [formData, setFormData] = useState({
    brand: equivalence?.brand || "",
    code: equivalence?.code || "",
  });

  const [updateArticleEquivalence, { isLoading: isUpdating }] =
    useUpdateArticleEquivalenceMutation();

  useEffect(() => {
    if (equivalence) {
      setFormData({
        brand: equivalence?.brand || "",
        code: equivalence?.code || "",
      });
    }
  }, [equivalence]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Se asume que equivalence tiene la propiedad id para identificar el registro
      await updateArticleEquivalence({
        id: equivalence.id,
        ...formData,
      }).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating article equivalence:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold mb-4">Editar Equivalencia</h2>
        <button
          onClick={closeModal}
          className="absolute top-1 right-1 bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
        >
          <IoMdClose className="text-sm" />
        </button>
      </div>

      <div className="mb-2">
        <label className="block mb-1">Marca:</label>
        <input
          type="text"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          className="w-full border p-1"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Código:</label>
        <input
          type="text"
          name="code"
          value={formData.code}
          onChange={handleChange}
          className="w-full border p-1"
        />
      </div>
      <button
        type="submit"
        disabled={isUpdating}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isUpdating ? "Actualizando..." : "Actualizar"}
      </button>
    </form>
  );
};
