"use client";
import React, { useState, useEffect, useRef } from "react";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import Modal from "@/app/components/components/Modal";
import { format } from "date-fns";
import { useGetCrmPrenotesQuery } from "@/redux/services/crmPrenotes";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { FaPlus } from "react-icons/fa";
import CreateCrmPrenoteComponent from "./CreateCrmPrenote";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import DeleteCrmPrenote from "./DeleteCrmPrenote";
import UpdateCrmPrenoteComponent from "./UpdateCrmPrenote";
const Page = () => {
  // Se obtiene la data mediante el query; no requiere argumentos, ya que el endpoint se construye con token
  const { data, error, isLoading, refetch } = useGetCrmPrenotesQuery(null);
  const [currentCrmId, setCurrentCrmId] = useState<string | null>(null);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  // Controlamos la paginación de forma local (client-side), mostrando de a 'limit' elementos
  const [page, setPage] = useState(1);
  const limit = 15;

  // Calculamos los elementos visibles en función de la página actual
  const visibleItems = data ? data.slice(0, page * limit) : [];
  const hasMore = data ? page * limit < data.length : false;

  // Referencia para el elemento observado (para infinite scroll)
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Estado para el modal de creación
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const openUpdateModal = (id: string) => {
    setCurrentCrmId(id);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentCrmId(null);
    refetch();
  };

  const openDeleteModal = (id: string) => {
    setCurrentCrmId(id);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentCrmId(null);
    refetch();
  };
  // Efecto para implementar el infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 0.5 }
    );
    const currentObserver = observerRef.current;
    if (currentObserver) {
      observer.observe(currentObserver);
    }
    return () => {
      if (currentObserver) {
        observer.unobserve(currentObserver);
      }
    };
  }, [hasMore]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  // Mapeo de la data visible para el Table
  const tableData = visibleItems.map((prenote) => ({
    key: prenote.id,
    id: prenote.id,
    name: prenote.name,
    edit: (
      <div className="flex justify-center items-center">
        <FaPencil
          className="text-center text-lg hover:cursor-pointer"
          onClick={() => openUpdateModal(prenote.id)}
        />
      </div>
    ),
    erase: (
      <div className="flex justify-center items-center">
        <FaTrashCan
          className="text-center text-lg hover:cursor-pointer"
          onClick={() => openDeleteModal(prenote.id)}
        />
      </div>
    ),
  }));

  const tableHeader = [
    { name: "ID", key: "id" },
    { name: "Name", key: "name" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: "New",
        onClick: () => setCreateModalOpen(true),
      },
    ],
    filters: [],
    results: `${data ? data.length : 0} Results`,
  };

  // Función para cerrar el modal y actualizar la data
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

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
        <h3 className="font-bold p-4">CRM Prenotes</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        {/* Elemento que se usa para disparar el infinite scroll */}
        <div ref={observerRef} className="h-10" />
      </div>
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateCrmPrenoteComponent closeModal={closeCreateModal} />
      </Modal>
      <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
        {currentCrmId && (
          <UpdateCrmPrenoteComponent crmPrenoteId={currentCrmId} closeModal={closeUpdateModal} />
        )}
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <DeleteCrmPrenote crmPrenoteId={currentCrmId || ""} closeModal={closeDeleteModal} />
      </Modal>
    </PrivateRoute>
  );
};

export default Page;
