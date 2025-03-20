"use client";
import { useCreateReclaimTypeMutation } from "@/redux/services/reclaimsTypes";
import React, { useState } from "react";
import { FaXmark } from "react-icons/fa6";

type CreateReclaimTypeComponentProps = {
  closeModal: () => void;
};

const CreateReclaimTypeComponent: React.FC<CreateReclaimTypeComponentProps> = ({
  closeModal,
}) => {
  const [id, setId] = useState("");
  const [categoria, setCategoria] = useState("STOCK");
  const [tipo, setTipo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [createReclaimType, { isLoading }] = useCreateReclaimTypeMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Para categorías diferentes a STOCK se requiere un "tipo"
    if (categoria !== "STOCK" && !tipo) {
      setError(
        `Para la categoría ${categoria} se requiere un "tipo" de reclamo.`
      );
      return;
    }
    try {
      await createReclaimType({
        id,
        categoria,
        tipo: tipo || undefined,
      }).unwrap();
      closeModal();
    } catch (err) {
      setError("Error al crear el tipo de reclamo.");
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <div className="p-1 absolute border-b top-0 right-0 bg-white z-10">
        <button
          onClick={closeModal}
          className=" hover:bg-gray-100 rounded-full transition-colors"
        >
          <FaXmark className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4">Crear Tipo de Reclamo</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="id" className="block">
            ID:
          </label>
          <input
            id="id"
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="border p-1 w-full"
            required
          />
        </div>
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
          disabled={isLoading}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {isLoading ? "Creando..." : "Crear"}
        </button>
      </form>
    </div>
  );
};

export default CreateReclaimTypeComponent;
