import { useCreateArticleTechnicalDetailMutation } from "@/redux/services/articlesTechnicalDetailsApi";
import { useGetAllTechnicalDetailQuery } from "@/redux/services/technicalDetails";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

interface CreateArticlesTechnicalDetailsModalProps {
  closeModal: () => void;
}

const CreateArticlesTechnicalDetailsModal: React.FC<CreateArticlesTechnicalDetailsModalProps> = ({ closeModal }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    id: "",
    article_id: "",
    technical_detail_id: "",
    value: "",
  });

  const {
    data: technicalDetails,
    isLoading: isLoadingTechnicalDetails,
    isError: isErrorTechnicalDetails,
  } = useGetAllTechnicalDetailQuery(null);
  const [createArticlesTechnicalDetail, { isLoading, isSuccess, isError }] =
    useCreateArticleTechnicalDetailMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prevForm) => ({
      ...prevForm,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createArticlesTechnicalDetail(form).unwrap();
      closeModal();
    } catch (error) {
      console.error(t("errorCreatingArticleTechnicalDetail"), error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t("createArticleTechnicalDetail")}</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex items-center justify-center"
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("technicalDetailLabel")}
            </label>
            <select
              name="technical_detail_id"
              value={form.technical_detail_id}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1 text-sm w-full"
              disabled={isLoadingTechnicalDetails || isErrorTechnicalDetails}
            >
              <option value="">{t("selectTechnicalDetailOption")}</option>
              {technicalDetails?.map((td: any) => (
                <option key={td.id} value={td.id}>
                  {td.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("valueLabel")}
            </label>
            <input
              type="text"
              name="value"
              value={form.value}
              onChange={handleChange}
              placeholder={t("valuePlaceholder")}
              className="border border-gray-300 rounded-md p-1 text-sm w-full"
            />
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
              className={`rounded-md px-3 py-1 text-sm text-white ${isLoading ? "bg-gray-500" : "bg-blue-600"}`}
            >
              {isLoading ? t("saving") : t("save")}
            </button>
          </div>
          {isSuccess && (
            <p className="text-green-500 text-sm mt-2">
              {t("articleTechnicalDetailCreatedSuccess")}
            </p>
          )}
          {isError && (
            <p className="text-red-500 text-sm mt-2">
              {t("errorCreatingArticleTechnicalDetail")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateArticlesTechnicalDetailsModal;
