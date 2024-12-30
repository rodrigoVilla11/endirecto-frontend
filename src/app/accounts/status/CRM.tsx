"use client";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import React, { useEffect, useState } from "react";
import CreateInstanceComponent from "./CreateInstance";
import Modal from "@/app/components/components/Modal";
import Instance from "./Instance";
import { IoMdClose } from "react-icons/io";

const CRM = ({ selectedClientId, closeModal}: any) => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const {
    data: customer,
    error,
    isLoading,
    refetch,
  } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  return (
    <div className={`h-auto m-5 p-1`}>
      <div className="flex justify-between items-center text-sm">
        <h3 className="font-bold px-4">CRM</h3>
        <button
          className="bg-black text-white rounded-md px-3 py-1 text-sm"
          onClick={openCreateModal}
        >
          New Instance
        </button>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
        >
          <IoMdClose className="text-sm" />
        </button>
      </div>

      {/* Renderizar las instancias si existen */}
      {customer?.instance && Array.isArray(customer.instance) ? (
        <div className="mt-4">
          {customer.instance.map((item: any, index: number) => (
            <Instance key={index} instances={item} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-gray-500">No instances available</p>
      )}

      {/* Modal para crear una nueva instancia */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateInstanceComponent closeModal={closeCreateModal} />
      </Modal>
    </div>
  );
};

export default CRM;
