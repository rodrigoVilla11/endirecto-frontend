"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaEdit } from "react-icons/fa"; // Se agrega FaEdit para la edición
import { FaPlus, FaTimes } from "react-icons/fa";
import {
  useGetArticlesVehiclesPagQuery,
  useUpdateArticleVehicleMutation, // Nuevo hook para actualizar
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
import { IoMdClose } from "react-icons/io";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [applicationsOfArticles, setApplicationsOfArticles] = useState<any[]>(
    []
  );
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false); // Modal de edición
  const [selectedArticleVehicle, setSelectedArticleVehicle] =
    useState<any>(null); // Registro a editar

  // Referencias para infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux
  const { data: articlesData } = useGetAllArticlesQuery(null);
  // Se espera que useGetArticlesVehiclesPagQuery retorne un objeto con { vehicles, totalVehicles }
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetArticlesVehiclesPagQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      sort: sortQuery,
    },
    {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [
    syncArticleVehicles,
    { isLoading: isLoadingSync, isSuccess, isError },
  ] = useSyncArticleVehiclesMutation();

  // Handler para actualizar (se usa dentro del modal de edición)
  // (El hook useUpdateArticleVehicleMutation se utilizará en el componente de edición)

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

  useEffect(() => {
    if (data?.vehicles) {
      setApplicationsOfArticles((prev) => {
        if (page === 1) {
          return data.vehicles;
        }
        const newArticles = data.vehicles.filter(
          (article) => !prev.some((item) => item.id === article.id)
        );
        return [...prev, ...newArticles];
      });
      setHasMore(data.vehicles.length === ITEMS_PER_PAGE);
    }
  }, [data?.vehicles, page]);

  const lastArticleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isQueryLoading) {
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.0, rootMargin: "200px" } // Se dispara 200px antes de que el sentinel esté visible
      );

      if (node) observerRef.current.observe(node);
    },
    [hasMore, isQueryLoading]
  );

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

  // Handler para abrir el modal de edición
  const handleEditArticleVehicle = (articleVehicle: any) => {
    setSelectedArticleVehicle(articleVehicle);
    setEditModalOpen(true);
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
      article: article?.name || t("notFound", { defaultValue: "Not found" }),
      brand: item?.brand || t("notFound", { defaultValue: "Not found" }),
      model: item?.model || t("notFound", { defaultValue: "Not found" }),
      engine: item?.engine || t("notFound", { defaultValue: "Not found" }),
      year: item?.year || t("notFound", { defaultValue: "Not found" }),
      actions: (
        <button
          onClick={() => handleEditArticleVehicle(item)}
          title="Editar"
          className="text-blue-500 hover:text-blue-700"
        >
          <FaEdit />
        </button>
      ),
    };
  });

  // Se agrega columna de acciones en el header
  const tableHeader = [
    { name: t("article"), key: "article", important: true, sortable: true },
    { name: t("brand"), key: "brand", important: true, sortable: true },
    { name: t("model"), key: "model", important: true, sortable: true },
    { name: t("engine"), key: "engine", important: true, sortable: true },
    { name: t("year"), key: "year", important: true },
    { name: t("actions"), key: "actions", important: false },
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
    return <div className="p-4 text-red-500">{t("errorLoading")}</div>;
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold pt-4 px-4">{t("applicationOfArticles")}</h3>
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
        <div ref={lastArticleRef} className="h-10" />

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
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            refetch();
          }}
        >
          <EditArticleVehicleComponent
            articleVehicle={selectedArticleVehicle}
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

// Componente para editar un Article Vehicle
type EditArticleVehicleComponentProps = {
  articleVehicle: any;
  closeModal: () => void;
};

const EditArticleVehicleComponent: React.FC<
  EditArticleVehicleComponentProps
> = ({ articleVehicle, closeModal }) => {
  const [formData, setFormData] = useState({
    brand: articleVehicle?.brand || "",
    model: articleVehicle?.model || "",
    engine: articleVehicle?.engine || "",
    year: articleVehicle?.year || "",
  });

  const [updateArticleVehicle, { isLoading: isUpdating, isError, isSuccess }] =
    useUpdateArticleVehicleMutation();

  useEffect(() => {
    if (articleVehicle) {
      setFormData({
        brand: articleVehicle?.brand || "",
        model: articleVehicle?.model || "",
        engine: articleVehicle?.engine || "",
        year: articleVehicle?.year || "",
      });
    }
  }, [articleVehicle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Se asume que articleVehicle tiene la propiedad id para identificar el registro
      await updateArticleVehicle({
        id: articleVehicle.id,
        ...formData,
      }).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating article vehicle:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold mb-4">Editar Article Vehicle</h2>
        <button
          onClick={closeModal}
          className="absolute top-1 right-1 bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
        >
          <IoMdClose className="text-sm" />
        </button>
      </div>
      <div className="mb-2">
        <label className="block mb-1">Brand:</label>
        <input
          type="text"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          className="w-full border p-1"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Model:</label>
        <input
          type="text"
          name="model"
          value={formData.model}
          onChange={handleChange}
          className="w-full border p-1"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Engine:</label>
        <input
          type="text"
          name="engine"
          value={formData.engine}
          onChange={handleChange}
          className="w-full border p-1"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Year:</label>
        <input
          type="text"
          name="year"
          value={formData.year}
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
