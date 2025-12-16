"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Header from "@/app/components/components/Header";
import Modal from "@/app/components/components/Modal";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { FaPlus, FaTimes } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import { IoIosTrash } from "react-icons/io";

import CreateReclaimTypeComponent from "./CreateReclaimType";
import UpdateReclaimTypeComponent from "./UpdateReclaimTyoe";
import DeleteReclaimTypeComponent from "./DeleteReclaimType";

import {
  useGetReclaimsTypesQuery,
  ReclaimType,
} from "@/redux/services/reclaimsTypes";
import { useUpdateReclaimTypeMutation } from "@/redux/services/reclaimsTypes";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // ======================================================
  // Estados Principales
  // ======================================================
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para modales y registro seleccionado
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentReclaimTypeId, setCurrentReclaimTypeId] = useState<
    string | null
  >(null);

  // ======================================================
  // Referencias (Infinite Scroll)
  // ======================================================
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ======================================================
  // Consultas a APIs (Redux)
  // ======================================================
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetReclaimsTypesQuery();
  const [updateReclaimType] = useUpdateReclaimTypeMutation();

  // ======================================================
  // Handlers y Funciones de Utilidad
  // ======================================================
  const handleModalOpen = (
    type: "create" | "update" | "delete",
    id?: string
  ) => {
    if (type === "create") {
      setCreateModalOpen(true);
      return;
    }
    if (id) {
      setCurrentReclaimTypeId(id);
      if (type === "update") {
        setUpdateModalOpen(true);
      } else if (type === "delete") {
        setDeleteModalOpen(true);
      }
    }
  };

  const handleModalClose = (type: "create" | "update" | "delete") => {
    if (type === "create") {
      setCreateModalOpen(false);
    } else if (type === "update") {
      setUpdateModalOpen(false);
    } else if (type === "delete") {
      setDeleteModalOpen(false);
    }
    setCurrentReclaimTypeId(null);
    refetch();
  };

  const handleEnable = async (id: string) => {
    try {
      await updateReclaimType({ id, deleted_at: null }).unwrap();
      refetch();
    } catch (err) {
      console.error("Error al habilitar el tipo de reclamo:", err);
    }
  };

  // ======================================================
  // useEffect para Actualizar la Lista y Evitar Duplicados
  // ======================================================
  useEffect(() => {
    if (data) {
      setItems((prev) => {
        if (page === 1) {
          return data;
        }
        const newItems = data.filter(
          (item: ReclaimType) =>
            !prev.some((prevItem) => prevItem.id === item.id)
        );
        return [...prev, ...newItems];
      });
      setHasMore(data.length === ITEMS_PER_PAGE);
    }
  }, [data, page]);

  // ======================================================
  // Infinite Scroll: lastReclaimTypeRef
  // ======================================================
  const lastReclaimTypeRef = useCallback(
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
  // Definición de tableData y Encabezado
  // ======================================================
  const tableData = useMemo(
    () =>
      items.map((item: ReclaimType) => ({
        key: item.id,
        id: item.id,
        categoria: item.categoria,
        tipo: item.tipo || "",
        edit: (
          <div className="flex justify-center items-center">
            <GoPencil
              className="text-center text-2xl text-white hover:cursor-pointer hover:text-black bg-green-400 p-1.5 rounded-sm"
              onClick={() => handleModalOpen("update", item.id)}
            />
          </div>
        ),
        actions: (
          <div className="flex justify-center items-center">
            {item.deleted_at ? (
              <button
                onClick={() => handleEnable(item.id)}
                className="text-center text-xs text-white hover:cursor-pointer hover:text-black bg-blue-400 p-1.5 rounded-sm"
                title="Habilitar"
              >
                Habilitar
              </button>
            ) : (
              <button
                onClick={() => handleModalOpen("delete", item.id)}
                className="text-center text-lg text-white hover:cursor-pointer hover:text-black bg-red-400 p-1.5 rounded-sm"
                title="Eliminar"
              >
                <IoIosTrash />
              </button>
            )}
          </div>
        ),
      })),
    [items, handleModalOpen]
  );

  const tableHeader = useMemo(
    () => [
      { name: "ID", key: "id" },
      { name: "Categoría", key: "categoria", sortable: true },
      { name: "Tipo", key: "tipo" },
      { component: <GoPencil className="text-center" />, key: "edit" },
      {
        component: <div className="text-center">Acciones</div>,
        key: "actions",
      },
    ],
    []
  );

  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: "Nuevo",
        onClick: () => handleModalOpen("create"),
      },
    ],
    filters: [],
    results: data ? `${data.length} Resultados` : "0 Resultados",
  };

  // ======================================================
  // Manejo de Estados de Carga y Error
  // ======================================================
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error al cargar los tipos de reclamo. Por favor, inténtalo más tarde.
      </div>
    );
  }

  // ======================================================
  // Renderizado
  // ======================================================
  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold pt-5 px-4 text-white">Tipos de Reclamo</h3>
        <Header headerBody={headerBody} />

        {items.length > 0 ? (
          <Table headers={tableHeader} data={tableData} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay tipos de reclamo
          </div>
        )}

        {/* Sentinel para Infinite Scroll */}
        <div ref={lastReclaimTypeRef} className="h-10" />

        {/* Modal de Creación */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => handleModalClose("create")}
        >
          <CreateReclaimTypeComponent
            closeModal={() => handleModalClose("create")}
          />
        </Modal>

        {/* Modal de Actualización */}
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => handleModalClose("update")}
        >
          {currentReclaimTypeId && (
            <UpdateReclaimTypeComponent
              reclaimTypeId={currentReclaimTypeId}
              closeModal={() => handleModalClose("update")}
            />
          )}
        </Modal>

        {/* Modal de Eliminación */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => handleModalClose("delete")}
        >
          {currentReclaimTypeId && (
            <DeleteReclaimTypeComponent
              reclaimTypeId={currentReclaimTypeId}
              closeModal={() => handleModalClose("delete")}
            />
          )}
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
