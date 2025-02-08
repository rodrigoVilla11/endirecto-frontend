// CreateTechnicalDetailsModal.tsx
import { useCreateTechnicalDetailMutation } from "@/redux/services/technicalDetails";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

interface CreateTechnicalDetailsModalProps {
  closeModal: () => void;
}

const CreateTechnicalDetailsModal: React.FC<CreateTechnicalDetailsModalProps> = ({ closeModal }) => {
  const [form, setForm] = useState({
    id: "",
    name: "",
  });

  const [createTechnicalDetail, { isLoading, isSuccess, isError }] = useCreateTechnicalDetailMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prevForm) => ({
      ...prevForm,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTechnicalDetail(form).unwrap();
      closeModal();
    } catch (error) {
      console.error("Error creating Technical Detail:", error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Create Technical Detail</h2>
          <button onClick={closeModal} className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex items-center justify-center">
            <IoMdClose className="text-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ID</label>
            <input
              type="text"
              name="id"
              value={form.id}
              onChange={handleChange}
              placeholder="Ingrese ID"
              className="border border-gray-300 rounded-md p-1 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ingrese nombre"
              className="border border-gray-300 rounded-md p-1 text-sm w-full"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 text-white rounded-md px-3 py-1 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`rounded-md px-3 py-1 text-sm text-white ${isLoading ? "bg-gray-500" : "bg-blue-600"}`}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
          {isSuccess && (
            <p className="text-green-500 text-sm mt-2">Technical Detail created successfully!</p>
          )}
          {isError && (
            <p className="text-red-500 text-sm mt-2">Error creating Technical Detail</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateTechnicalDetailsModal;
