"use client";
import React, { useState, useEffect } from "react";
import {
  useGetReclaimTypeByIdQuery,
  useUpdateReclaimTypeMutation,
} from "@/redux/services/reclaimsTypes";
import { FaXmark } from "react-icons/fa6";

type UpdateReclaimTypeComponentProps = {
  reclaimTypeId: string;
  closeModal: () => void;
};

const UpdateReclaimTypeComponent: React.FC<UpdateReclaimTypeComponentProps> = ({
  reclaimTypeId,
  closeModal,
}) => {
  const {
    data,
    isLoading: isFetching,
    error,
  } = useGetReclaimTypeByIdQuery({ id: reclaimTypeId });
  const [updateReclaimType, { isLoading: isUpdating }] =
    useUpdateReclaimTypeMutation();

  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setCategoria(data.categoria);
      setTipo(data.tipo || "");
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (categoria !== "STOCK" && !tipo) {
      setLocalError(
        `Para la categoría ${categoria} se requiere un "tipo" de reclamo.`
      );
      return;
    }
    try {
      await updateReclaimType({
        id: reclaimTypeId,
        categoria,
        tipo: tipo || undefined,
      }).unwrap();
      closeModal();
    } catch (err) {
      setLocalError("Error al actualizar el tipo de reclamo.");
      console.error(err);
    }
  };

  if (isFetching) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">Error al cargar el tipo de reclamo.</div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl">
      <div className=" p-1 absolute top-0 right-0 z-10">
        <button
          onClick={closeModal}
          className=" hover:bg-gray-100 rounded-full transition-colors"
        >
          <FaXmark className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <h2 className="text-xl font-bold mb-4">Actualizar Tipo de Reclamo</h2>
      {localError && <p className="text-red-500 mb-2">{localError}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="categoria" className="block">
            Categoría:
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="border p-1 w-full"
          >
            <option value="STOCK">STOCK</option>
            <option value="SISTEMA">SISTEMA</option>
            <option value="DATOS DE ARTICULO">DATOS DE ARTICULO</option>
            <option value="ATENCION AL CLIENTE">ATENCION AL CLIENTE</option>
            <option value="REPARTO">REPARTO</option>
            <option value="ADMINISTRACION">ADMINISTRACION</option>
            <option value="DEVOLUCIONES">DEVOLUCIONES</option>
          </select>
        </div>
        {categoria !== "STOCK" && (
          <div>
            <label htmlFor="tipo" className="block">
              Tipo:
            </label>
            <input
              id="tipo"
              type="text"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="border p-1 w-full"
              required
            />
          </div>
        )}
        <button
          type="submit"
          disabled={isUpdating}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {isUpdating ? "Actualizando..." : "Actualizar"}
        </button>
      </form>
    </div>
  );
};

export default UpdateReclaimTypeComponent;
