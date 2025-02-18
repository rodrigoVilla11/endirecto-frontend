import { useCreateArticleVehicleMutation } from "@/redux/services/articlesVehicles";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

interface CreateArticleVehicleProps {
  closeModal: () => void;
}

const CreateArticleVehicleComponent: React.FC<CreateArticleVehicleProps> = ({ closeModal }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    id: "",
    article_id: "",
    brand: "",
    engine: "",
    model: "",
    year: "",
  });

  const [createArticleVehicle, { isLoading, isSuccess, isError }] = useCreateArticleVehicleMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prevForm) => ({
      ...prevForm,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createArticleVehicle(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error creating Article Vehicle:", err);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t("newArticleVehicle")}</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Primera fila: id y article_id */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("idLabel")}
              </label>
              <input
                type="text"
                name="id"
                value={form.id}
                onChange={handleChange}
                placeholder={t("idPlaceholder")}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("articleIdLabel")}
              </label>
              <input
                type="text"
                name="article_id"
                value={form.article_id}
                onChange={handleChange}
                placeholder={t("articleIdPlaceholder")}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              />
            </div>
          </div>

          {/* Segunda fila: Brand y Engine */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("brandLabel")}
              </label>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder={t("brandPlaceholder")}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("engineLabel")}
              </label>
              <input
                type="text"
                name="engine"
                value={form.engine}
                onChange={handleChange}
                placeholder={t("enginePlaceholder")}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              />
            </div>
          </div>

          {/* Tercera fila: Model y Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("modelLabel")}
              </label>
              <input
                type="text"
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder={t("modelPlaceholder")}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("yearLabel")}
              </label>
              <input
                type="text"
                name="year"
                value={form.year}
                onChange={handleChange}
                placeholder={t("yearPlaceholder")}
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
              disabled={isLoading}
              className={`rounded-md px-3 py-1 text-sm text-white ${
                isLoading ? "bg-gray-500" : "bg-blue-600"
              }`}
            >
              {isLoading ? t("saving") : t("save")}
            </button>
          </div>

          {isSuccess && (
            <p className="text-green-500 text-sm mt-2">
              {t("articleVehicleCreatedSuccess")}
            </p>
          )}
          {isError && (
            <p className="text-red-500 text-sm mt-2">
              {t("errorCreatingArticleVehicle")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateArticleVehicleComponent;
