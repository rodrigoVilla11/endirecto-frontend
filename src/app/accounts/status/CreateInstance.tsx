"use client";
import { useGetCustomerByIdQuery, InstanceType, PriorityInstance, useUpdateCustomerMutation } from "@/redux/services/customersApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useClient } from "@/app/context/ClientContext";
import { useAuth } from "@/app/context/AuthContext";
import { useTranslation } from "react-i18next";

const CreateInstanceComponent = ({ closeModal }: { closeModal: () => void }) => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const { data: customer, error, isLoading, refetch } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const [form, setForm] = useState({
    type: InstanceType.WHATSAPP_MESSAGE,
    priority: PriorityInstance.MEDIUM,
    notes: "",
  });

  const [updateCustomer, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateCustomerMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentInstances = customer?.instance ?? [];
      const newInstance = {
        type: form.type,
        priority: form.priority,
        notes: form.notes,
      };
      const updatedInstances = [...currentInstances, newInstance];
      const payload = {
        id: selectedClientId || "",
        instance: updatedInstances,
      };
      await updateCustomer(payload).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("errorCreatingInstance"), err);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t("newInstance")}</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
            aria-label={t("close")}
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium">{t("type")}</label>
              <select
                name="type"
                value={form.type}
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
              <label className="block text-xs font-medium">{t("priority")}</label>
              <select
                name="priority"
                value={form.priority}
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
            <div className="col-span-2">
              <label className="block text-xs font-medium">{t("notes")}</label>
              <textarea
                name="notes"
                onChange={handleChange}
                value={form.notes}
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
              {t("cancel")}
            </button>
            <button
              type="submit"
              className={`rounded-md px-3 py-1 text-sm text-white ${
                isUpdating ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={isUpdating}
            >
              {isUpdating ? t("saving") : t("save")}
            </button>
          </div>
          {isSuccess && (
            <p className="text-green-500 text-sm mt-2">{t("instanceCreatedSuccess")}</p>
          )}
          {isError && (
            <p className="text-red-500 text-sm mt-2">{t("errorCreatingInstance")}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateInstanceComponent;
