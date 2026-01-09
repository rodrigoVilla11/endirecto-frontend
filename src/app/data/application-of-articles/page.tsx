"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaEdit } from "react-icons/fa";
import { FaPlus, FaTimes } from "react-icons/fa";
import {
  useGetArticlesVehiclesPagQuery,
  useUpdateArticleVehicleMutation,
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
  const [internalSearchQuery, setInternalSearchQuery] = useState(""); // Para el input
  const [sortQuery, setSortQuery] = useState<string>("");
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedArticleVehicle, setSelectedArticleVehicle] =
    useState<any>(null);

  // Referencias para infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux
  const { data: articlesData } = useGetAllArticlesQuery(null);

  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
    isFetching,
  } = useGetArticlesVehiclesPagQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      sort: sortQuery,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [
    syncArticleVehicles,
    { isLoading: isSyncing, isSuccess, isError: isSyncError },
  ] = useSyncArticleVehiclesMutation();

  const handleSyncEquivalences = async () => {
    if (isSyncing) return; // evita doble click
    try {
      await syncArticleVehicles().unwrap();
      setPage(1);
      setApplicationsOfArticles([]);
      setHasMore(true);
      refetch();
    } catch (error) {
      console.error("Error al sincronizar equivalencias:", error);
    }
  };

  // Debounced search mejorado
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      resetPagination();
    }, 300), // Aumentado a 300ms para mejor UX
    []
  );

  // Función para resetear paginación
  const resetPagination = () => {
    setPage(1);
    setApplicationsOfArticles([]);
    setHasMore(true);
  };

  // Efecto para manejar cambios en el search query
  useEffect(() => {
    debouncedSearch(internalSearchQuery);
  }, [internalSearchQuery, debouncedSearch]);

  // Efecto para manejar los datos recibidos
  useEffect(() => {
    if (data?.vehicles) {
      setApplicationsOfArticles((prev) => {
        // Si es la primera página o nueva búsqueda, reemplazar datos
        if (page === 1) {
          return data.vehicles;
        }

        // Para páginas subsecuentes, agregar solo nuevos elementos
        const existingIds = new Set(prev.map((item) => item.id));
        const newArticles = data.vehicles.filter(
          (article) => !existingIds.has(article.id)
        );
        return [...prev, ...newArticles];
      });

      // Determinar si hay más páginas
      setHasMore(data.vehicles.length === ITEMS_PER_PAGE);
      setIsLoading(false);
    }
  }, [data, page]);

  // Efecto para resetear cuando cambia la query de búsqueda
  useEffect(() => {
    if (page === 1) {
      setApplicationsOfArticles([]);
    }
  }, [searchQuery, sortQuery]);

  // Intersection Observer para infinite scroll
  const lastArticleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isQueryLoading || isFetching) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            hasMore &&
            !isQueryLoading &&
            !isFetching
          ) {
            setIsLoading(true);
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.1, rootMargin: "100px" }
      );

      if (node) observerRef.current.observe(node);
    },
    [hasMore, isQueryLoading, isFetching]
  );

  // Reset de búsqueda
  const handleResetSearch = () => {
    setInternalSearchQuery("");
    setSearchQuery("");
    resetPagination();
  };

  // Handlers de modales
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    resetPagination();
    refetch();
  };

  const openImportModal = () => setImportModalOpen(true);
  const closeImportModal = () => {
    setImportModalOpen(false);
    resetPagination();
    refetch();
  };

  const openExportModal = () => setExportModalOpen(true);
  const closeExportModal = () => {
    setExportModalOpen(false);
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
      resetPagination();
    },
    [sortQuery]
  );

  // Configuración de la tabla
  const tableData = applicationsOfArticles?.map((item, index) => {
    const article = articlesData?.find((data) => data.id === item.article_id);
    return {
      key: `${item.id || index}`,
      article:
        article?.supplier_code ||
        t("notFound", { defaultValue: "No encontrado" }),
      brand: item?.brand || t("notFound", { defaultValue: "No encontrado" }),
      model: item?.model || t("notFound", { defaultValue: "No encontrado" }),
      engine: item?.engine || t("notFound", { defaultValue: "No encontrado" }),
      year: item?.year || t("notFound", { defaultValue: "No encontrado" }),
      actions: (
        <button
          onClick={() => handleEditArticleVehicle(item)}
          title={t("edit", { defaultValue: "Editar" })}
          className="text-blue-500 hover:text-blue-700 transition-colors"
        >
          <FaEdit />
        </button>
      ),
    };
  });

  const tableHeader = [
    { name: t("article"), key: "article", important: true, sortable: true },
    { name: t("brand"), key: "brand", important: true, sortable: true },
    { name: t("model"), key: "model", important: true, sortable: true },
    { name: t("engine"), key: "engine", important: true, sortable: true },
    { name: t("year"), key: "year", important: true, sortable: true },
    { name: t("actions"), key: "actions", important: false },
  ];

  // Configuración del header
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
      // {
      //   logo: <IoSync className={isSyncing ? "animate-spin" : ""} />,
      //   title: isSyncing
      //     ? t("syncing", { defaultValue: "Sincronizando..." })
      //     : t("syncApplications", { defaultValue: "Sincronizar aplicaciones" }),
      //   onClick: handleSyncEquivalences,
      //   disabled: isSyncing,
      // },
    ],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder={t("searchPlaceholder", {
                defaultValue: "Buscar...",
              })}
              value={internalSearchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setInternalSearchQuery(e.target.value);
              }}
              className="pr-8"
            />
            {internalSearchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={handleResetSearch}
                aria-label={t("clearSearch", {
                  defaultValue: "Limpiar búsqueda",
                })}
              >
                <FaTimes />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: `${"Resultados"} : ${data?.total || 0}${
      searchQuery ? ` (filtrado por: "${searchQuery}")` : ""
    }`,
  };

  // Estados de carga
  if (isQueryLoading && applicationsOfArticles.length === 0) {
    return (
      <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-2">
            {t("loading", { defaultValue: "Cargando..." })}
          </span>
        </div>
      </PrivateRoute>
    );
  }

  if (error) {
    return (
      <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
        <div className="p-4 text-red-500">
          {t("errorLoading", { defaultValue: "Error al cargar los datos" })}
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold pt-4 px-4 text-white">
          {t("applicationOfArticles", {
            defaultValue: "Aplicaciones de Artículos",
          })}
        </h3>

        <Header headerBody={headerBody} />

        {applicationsOfArticles.length === 0 && !isQueryLoading ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery
              ? t("noResultsFound", {
                  defaultValue: "No se encontraron resultados para la búsqueda",
                })
              : t("noApplicationsFound", {
                  defaultValue: "No se encontraron aplicaciones",
                })}
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

            {/* Indicador de carga para infinite scroll */}
            {(isLoading || isFetching) && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                <span className="ml-2 text-sm text-gray-600">
                  {t("loadingMore", { defaultValue: "Cargando más..." })}
                </span>
              </div>
            )}
          </>
        )}

        {/* Elemento observador para infinite scroll */}
        {hasMore && !isQueryLoading && (
          <div ref={lastArticleRef} className="h-10" />
        )}

        {/* Mensajes de sincronización */}
        {isSyncing && (
          <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded">
            {t("syncing", { defaultValue: "Sincronizando..." })}
          </div>
        )}

        {isSuccess && (
          <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
            {t("syncSuccess", { defaultValue: "Sincronización exitosa" })}
          </div>
        )}

        {isSyncError && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
            {t("syncError", { defaultValue: "Error en la sincronización" })}
          </div>
        )}

        {/* Modales */}
        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateArticleVehicleComponent closeModal={closeCreateModal} />
        </Modal>

        <Modal isOpen={isImportModalOpen} onClose={closeImportModal}>
          <ImportExcelModal closeModal={closeImportModal} />
        </Modal>

        <Modal isOpen={isExportModalOpen} onClose={closeExportModal}>
          <ExportExcelButton
            closeModal={closeExportModal}
            searchQuery={searchQuery}
          />
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            resetPagination();
            refetch();
          }}
        >
          <EditArticleVehicleComponent
            articleVehicle={selectedArticleVehicle}
            closeModal={() => {
              setEditModalOpen(false);
              resetPagination();
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
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    brand: articleVehicle?.brand || "",
    model: articleVehicle?.model || "",
    engine: articleVehicle?.engine || "",
    year: articleVehicle?.year || "",
  });

  const [updateArticleVehicle, { isLoading: isUpdating, isError, error }] =
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
    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {t("editArticleVehicle", {
            defaultValue: "Editar Aplicación de Artículo",
          })}
        </h2>
        <button
          onClick={closeModal}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t("close", { defaultValue: "Cerrar" })}
        >
          <IoMdClose className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("brand", { defaultValue: "Marca" })}:
          </label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("model", { defaultValue: "Modelo" })}:
          </label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("engine", { defaultValue: "Motor" })}:
          </label>
          <input
            type="text"
            name="engine"
            value={formData.engine}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("year", { defaultValue: "Año" })}:
          </label>
          <input
            type="text"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <span className="text-sm text-red-700">
              {t("errorUpdating", { defaultValue: "Error al actualizar" })}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            disabled={isUpdating}
          >
            {t("cancel", { defaultValue: "Cancelar" })}
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-2"
          >
            {isUpdating && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            )}
            {isUpdating
              ? t("updating", { defaultValue: "Actualizando..." })
              : t("update", { defaultValue: "Actualizar" })}
          </button>
        </div>
      </form>
    </div>
  );
};
