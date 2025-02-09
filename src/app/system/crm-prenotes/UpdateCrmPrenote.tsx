'use client'
import React, { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useGetCrmPrenoteByIdQuery, useUpdateCrmPrenoteMutation } from "@/redux/services/crmPrenotes";

type UpdateCrmPrenoteComponentProps = {
  crmPrenoteId: string;
  closeModal: () => void;
};

const UpdateCrmPrenoteComponent = ({ crmPrenoteId, closeModal }: UpdateCrmPrenoteComponentProps) => {
  const { data: crmPrenote, error, isLoading } = useGetCrmPrenoteByIdQuery({ id: crmPrenoteId });
  const [updateCrmPrenote, { isLoading: isUpdating, isSuccess, isError }] = useUpdateCrmPrenoteMutation();

  // Estado local para el formulario: solo se manejan los campos "id" y "name"
  const [form, setForm] = useState({
    id: "",
    name: "",
  });

  // Cuando se obtiene el prenote, se carga en el formulario
  useEffect(() => {
    if (crmPrenote) {
      setForm({
        id: crmPrenote.id,       // Se asume que el modelo usa "id" (no _id)
        name: crmPrenote.name ?? "",
      });
    }
  }, [crmPrenote]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCrmPrenote(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating CRM Prenote:", err);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">Update CRM Prenote</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleUpdate}>
        <label className="flex flex-col">
          ID:
          <input
            type="text"
            name="id"
            value={form.id}
            onChange={handleChange}
            className="border border-black rounded-md w-96 p-2"
            disabled
          />
        </label>
        <label className="flex flex-col">
          Name:
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border border-black rounded-md w-96 p-2"
          />
        </label>
        <div className="flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 rounded-md p-2 text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`rounded-md p-2 text-white ${isUpdating ? "bg-gray-500" : "bg-success"}`}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
        </div>
        {isSuccess && <p className="text-green-500">CRM Prenote updated successfully!</p>}
        {isError && <p className="text-red-500">Error updating CRM Prenote</p>}
      </form>
    </div>
  );
};

export default UpdateCrmPrenoteComponent;
