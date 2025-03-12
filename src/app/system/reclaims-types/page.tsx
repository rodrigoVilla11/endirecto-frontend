"use client";
import React, { useState } from "react";
import Header from "@/app/components/components/Header";
import Modal from "@/app/components/components/Modal";
import Table from "@/app/components/components/Table";
import { FaPlus } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import { IoIosTrash } from "react-icons/io";
import CreateReclaimTypeComponent from "./CreateReclaimType";
import UpdateReclaimTypeComponent from "./UpdateReclaimTyoe";
import DeleteReclaimTypeComponent from "./DeleteReclaimType";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useGetReclaimsTypesQuery, ReclaimType } from "@/redux/services/reclaimsTypes";
import { useUpdateReclaimTypeMutation } from "@/redux/services/reclaimsTypes";

const Page = () => {
  // Estados para modales
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentReclaimTypeId, setCurrentReclaimTypeId] = useState<string | null>(null);

  // Query de reclaimsTypes
  const { data, error, isLoading, refetch } = useGetReclaimsTypesQuery();

  // Mutation para actualizar (habilitar/deshabilitar) un tipo de reclamo
  const [updateReclaimType] = useUpdateReclaimTypeMutation();

  // Manejador para abrir modales
  const handleModalOpen = (type: "create" | "update" | "delete", id?: string) => {
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

  // Manejador para cerrar modales y refrescar datos
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

  // Manejador para habilitar un tipo de reclamo (cambiar deleted_at a null)
  const handleEnable = async (id: string) => {
    try {
      await updateReclaimType({ id, deleted_at: null }).unwrap();
      refetch();
    } catch (err) {
      console.error("Error al habilitar el tipo de reclamo:", err);
    }
  };

  // Configuración de encabezados para la tabla
  const tableHeader = [
    { name: "ID", key: "id" },
    { name: "Categoría", key: "categoria", sortable: true },
    { name: "Tipo", key: "tipo" },
    { component: <GoPencil className="text-center" />, key: "edit" },
    { component: <div className="text-center ">Acciones</div>, key: "actions" },
  ];

  // Preparar los datos para la tabla
  const tableData =
    data?.map((item: ReclaimType) => ({
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
    })) || [];

  // Encabezado con botones (por ejemplo, para crear un nuevo registro)
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

  // Manejo de estados de carga y error
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

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold pt-5 px-4">Tipos de Reclamo</h3>
        <Header headerBody={headerBody} />

        {data && data.length > 0 ? (
          <Table headers={tableHeader} data={tableData} />
        ) : (
          <div className="text-center py-8 text-gray-500">No hay tipos de reclamo</div>
        )}

        <Modal isOpen={isCreateModalOpen} onClose={() => handleModalClose("create")}>
          <CreateReclaimTypeComponent closeModal={() => handleModalClose("create")} />
        </Modal>

        <Modal isOpen={isUpdateModalOpen} onClose={() => handleModalClose("update")}>
          {currentReclaimTypeId && (
            <UpdateReclaimTypeComponent
              reclaimTypeId={currentReclaimTypeId}
              closeModal={() => handleModalClose("update")}
            />
          )}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={() => handleModalClose("delete")}>
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
