import { useClient } from "@/app/context/ClientContext";
import {
  InstanceType,
  PriorityInstance,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

const CreateInstanceComponent = ({
  closeModal,
}: {
  closeModal: () => void;
}) => {
  const { selectedClientId } = useClient();

  const [form, setForm] = useState({
    id: selectedClientId ? selectedClientId : "",
    instance: {
      type: InstanceType.WHATSAPP_MESSAGE,
      priority: PriorityInstance.MEDIUM,
      notes: "",
    },
  });

  const [updateCustomer, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateCustomerMutation();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      instance: {
        ...prevForm.instance,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCustomer(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error al crear el CRM:", err);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New Instance</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium">Client Id</label>
              <input
                type="text"
                name="id"
                value={form.id}
                disabled
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium">Type</label>
              <select
                name="type"
                value={form.instance.type}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              >
                {Object.values(InstanceType).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium">Priority</label>
              <select
                name="priority"
                value={form.instance.priority}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              >
                {Object.values(PriorityInstance).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium">Notes</label>
              <textarea
                name="notes"
                onChange={handleChange}
                value={form.instance.notes}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              />
            </div>
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
              className={`rounded-md px-3 py-1 text-sm text-white ${
                isUpdating ? "bg-gray-500" : "bg-blue-600"
              }`}
              disabled={isUpdating}
            >
              {isUpdating ? "Saving..." : "Save"}
            </button>
          </div>

          {isSuccess && (
            <p className="text-green-500 text-sm mt-2">
              Instance created successfully!
            </p>
          )}
          {isError && (
            <p className="text-red-500 text-sm mt-2">Error creating Instance</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateInstanceComponent;
