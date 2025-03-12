"use client";
import React, { useState } from "react";
import { useDeleteReclaimTypeMutation } from "@/redux/services/reclaimsTypes";

type DeleteReclaimTypeComponentProps = {
  reclaimTypeId: string;
  closeModal: () => void;
};

const DeleteReclaimTypeComponent: React.FC<DeleteReclaimTypeComponentProps> = ({ reclaimTypeId, closeModal }) => {
  const [deleteReclaimType, { isLoading }] = useDeleteReclaimTypeMutation();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      await deleteReclaimType({ id: reclaimTypeId }).unwrap();
      closeModal();
    } catch (err) {
      setError("Error al eliminar el tipo de reclamo.");
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Eliminar Tipo de Reclamo</h2>
      <p>¿Estás seguro de que deseas eliminar este tipo de reclamo?</p>
      {error && <p className="text-red-500 my-2">{error}</p>}
      <div className="flex gap-4 mt-4">
        <button onClick={handleDelete} disabled={isLoading} className="bg-red-500 text-white p-2 rounded">
          {isLoading ? "Eliminando..." : "Eliminar"}
        </button>
        <button onClick={closeModal} className="bg-gray-300 text-black p-2 rounded">
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default DeleteReclaimTypeComponent;
