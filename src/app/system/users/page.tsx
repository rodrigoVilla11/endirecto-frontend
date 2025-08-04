"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Header from "@/app/components/components/Header";
import Input from "@/app/components/components/Input";
import Table from "@/app/components/components/Table";
import Modal from "@/app/components/components/Modal";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";
import { useTranslation } from "react-i18next";

import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import {
  useCountUsersQuery,
  useGetUsersPagQuery,
} from "@/redux/services/usersApi";

import { FaPlus, FaTimes } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import { IoIosTrash } from "react-icons/io";

import CreateUserComponent from "./CreateUser";
import UpdateUserComponent from "./UpdateUser";
import DeleteUserComponent from "./DeleteUser";
import { AiFillFileExcel } from "react-icons/ai";
import ExportUsersModal from "./ExportExcelButton";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // ======================================================
  // Estados Principales
  // ======================================================
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "">("");

  // Estados para modales y usuario seleccionado
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ======================================================
  // Referencias (Infinite Scroll)
  // ======================================================
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ======================================================
  // Consultas a APIs (Redux)
  // ======================================================
  const { data: branchData } = useGetBranchesQuery(null);
  const { data: countUsersData } = useCountUsersQuery(null);
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetUsersPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortField && sortOrder ? `${sortField}:${sortOrder}` : "",
  });

  // ======================================================
  // Handlers y Funciones de Utilidad
  // ======================================================

  // Ordenar la tabla: si se hace click en el mismo campo se alterna la dirección;
  // si se selecciona otro campo, se inicia en asc.
  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortOrder("asc");
      }
      setPage(1);
      setUsers([]);
      setHasMore(true);
    },
    [sortField]
  );

  // Búsqueda optimizada con debounce (delay de 300ms)
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setPage(1);
      setUsers([]);
      setHasMore(true);
    }, 300),
    []
  );

  // Reiniciar la búsqueda
  const handleResetSearch = useCallback(() => {
    setSearchQuery("");
    setPage(1);
    setUsers([]);
    setHasMore(true);
  }, []);

  // Abrir modales: para crear, actualizar o eliminar. Para update/delete se codifica el id.
  const handleModalOpen = useCallback(
    (type: "create" | "update" | "delete", id?: string) => {
      if (type === "create") {
        setCreateModalOpen(true);
      } else if (id) {
        setCurrentUserId(encodeURIComponent(id));
        if (type === "update") {
          setUpdateModalOpen(true);
        } else {
          setDeleteModalOpen(true);
        }
      }
    },
    []
  );

  // Cerrar modales y refrescar datos
  const handleModalClose = useCallback(
    (type: "create" | "update" | "delete") => {
      if (type === "create") {
        setCreateModalOpen(false);
      } else if (type === "update") {
        setUpdateModalOpen(false);
      } else {
        setDeleteModalOpen(false);
      }
      setCurrentUserId(null);
      refetch();
    },
    [refetch]
  );

  // ======================================================
  // Efectos
  // ======================================================

  const openExportModal = () => setExportModalOpen(true);
  const closeExportModal = () => {
    setExportModalOpen(false);
  };

  // Actualizar la lista de usuarios y evitar duplicados (similar al de articles)
  useEffect(() => {
    if (data) {
      setUsers((prev) => {
        if (page === 1) {
          return data;
        }
        const newUsers = data.filter(
          (user: any) => !prev.some((item) => item.id === user.id)
        );
        return [...prev, ...newUsers];
      });
      setHasMore(data.length === ITEMS_PER_PAGE);
    }
  }, [data, page]);

  // Configurar el Intersection Observer para el infinite scroll
  const lastUserRef = useCallback(
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

  // ======================================================
  // Datos Memorizados para la Tabla y Encabezado
  // ======================================================

  // Definición de tableData, separada en un useMemo
  const tableData = useMemo(
    () =>
      users.map((user) => {
        const branch = branchData?.find((b: any) => b.id === user.branch);
        return {
          key: user._id,
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          branch: branch?.name || t("noBranch"),
          zone: user.zone || t("noZone"),
          edit: (
            <div className="flex justify-center items-center">
              <GoPencil
                className="text-center font-bold text-3xl text-white hover:cursor-pointer hover:text-black bg-green-400 p-1.5 rounded-sm"
                onClick={() => handleModalOpen("update", user._id)}
              />
            </div>
          ),
          erase: (
            <div className="flex justify-center items-center">
              <IoIosTrash
                className="text-center text-3xl text-white hover:cursor-pointer hover:text-black bg-red-400 p-1.5 rounded-sm"
                onClick={() => handleModalOpen("delete", user._id)}
              />
            </div>
          ),
        };
      }),
    [users, branchData, t, handleModalOpen]
  );

  // Definición del encabezado de la tabla
  const tableHeader = useMemo(
    () => [
      { name: t("id"), key: "id" },
      { name: t("user"), key: "username", important: true, sortable: true },
      { name: t("email"), key: "email" },
      { name: t("role"), key: "role", important: true, sortable: true },
      { name: t("branch"), key: "branch" },
      { name: t("zone"), key: "zone" },
      { component: <GoPencil className="text-center text-lg" />, key: "edit" },
      {
        component: <IoIosTrash className="text-center text-lg" />,
        key: "erase",
      },
    ],
    [t]
  );

  // Encabezado y filtros de la página
  const headerBody = useMemo(
    () => ({
      buttons: [
        {
          logo: <FaPlus />,
          title: t("new"),
          onClick: () => handleModalOpen("create"),
        },
        {
          logo: <AiFillFileExcel />,
          title: t("exportExcel"),
          onClick: openExportModal,
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
      results: searchQuery
        ? `${t("results", { count: users.length })}`
        : `${t("results", { count: countUsersData })}`,
    }),
    [
      searchQuery,
      users.length,
      countUsersData,
      debouncedSearch,
      handleResetSearch,
      handleModalOpen,
      t,
    ]
  );

  // ======================================================
  // Renderizado Condicional
  // ======================================================
  if (isQueryLoading && users.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{t("errorLoadingUsers")}</div>;
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold pt-5 px-4">{t("users")}</h3>
        <Header headerBody={headerBody} />

        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("noUsersFound")}
          </div>
        ) : (
          <>
            <Table
              headers={tableHeader}
              data={tableData}
              onSort={handleSort}
              sortField={sortField}
              sortOrder={sortOrder}
            />
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}

        {/* Sentinel para Infinite Scroll */}
        <div ref={lastUserRef} className="h-10" />

        {/* Modal de Creación */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => handleModalClose("create")}
        >
          <CreateUserComponent closeModal={() => handleModalClose("create")} />
        </Modal>

        {/* Modal de Actualización */}
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => handleModalClose("update")}
        >
          {currentUserId && (
            <UpdateUserComponent
              userId={currentUserId}
              closeModal={() => handleModalClose("update")}
            />
          )}
        </Modal>

        {/* Modal de Eliminación */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => handleModalClose("delete")}
        >
          {currentUserId && (
            <DeleteUserComponent
              userId={currentUserId}
              closeModal={() => handleModalClose("delete")}
            />
          )}
        </Modal>

        <Modal isOpen={isExportModalOpen} onClose={closeExportModal}>
          <ExportUsersModal
            closeModal={closeExportModal}
            searchQuery={searchQuery}
          />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
