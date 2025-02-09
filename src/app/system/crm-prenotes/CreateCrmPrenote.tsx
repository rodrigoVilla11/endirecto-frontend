'use client'
import { useCreateCrmPrenoteMutation } from "@/redux/services/crmPrenotes";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

interface CreateCrmPrenoteComponentProps {
  closeModal: () => void;
}

const CreateCrmPrenoteComponent = ({ closeModal }: CreateCrmPrenoteComponentProps) => {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [createCrmPrenote, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateCrmPrenoteMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCrmPrenote({ id, name }).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error al crear CRM Prenote:", err);
    }
  };

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">New CRM Prenote</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col">
          ID:
          <input
            type="text"
            value={id}
            placeholder="Enter ID"
            onChange={(e) => setId(e.target.value)}
            className="border border-black rounded-md w-96 p-2"
          />
        </label>
        <label className="flex flex-col">
          Name:
          <input
            type="text"
            value={name}
            placeholder="Enter Name"
            onChange={(e) => setName(e.target.value)}
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
            className={`rounded-md p-2 text-white ${
              isLoadingCreate ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isLoadingCreate}
          >
            {isLoadingCreate ? "Saving..." : "Save"}
          </button>
        </div>
        {isSuccess && (
          <p className="text-green-500">CRM Prenote created successfully!</p>
        )}
        {isError && <p className="text-red-500">Error creating CRM Prenote</p>}
      </form>
    </div>
  );
};

export default CreateCrmPrenoteComponent;
