import { useCreateArticleEquivalenceMutation } from "@/redux/services/articlesEquivalences";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

interface CreateArticlesEquivalencesModalProps {
  closeModal: () => void;
}

const CreateArticlesEquivalencesModal: React.FC<CreateArticlesEquivalencesModalProps> = ({ closeModal }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    id: "",
    article_id: "",
    brand: "",
    code: "",
  });

  const [createArticleEquivalence, { isLoading, isSuccess, isError }] = useCreateArticleEquivalenceMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prevForm) => ({
      ...prevForm,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createArticleEquivalence(form).unwrap();
      closeModal();
    } catch (error) {
      console.error(t("errorCreatingArticleEquivalence"), error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t("createArticleEquivalence")}</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex items-center justify-center"
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("idLabel")}</label>
            <input
              type="text"
              name="id"
              value={form.id}
              onChange={handleChange}
              placeholder={t("idPlaceholderEquivalences")}
              className="border border-gray-300 rounded-md p-1 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("articleIdLabel")}</label>
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
            <label className="block text-sm font-medium text-gray-700">{t("brandLabel")}</label>
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
            <label className="block text-sm font-medium text-gray-700">{t("codeLabel")}</label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder={t("codePlaceholder")}
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
            <p className="text-green-500 text-sm mt-2">{t("articleEquivalenceCreatedSuccess")}</p>
          )}
          {isError && (
            <p className="text-red-500 text-sm mt-2">{t("errorCreatingArticleEquivalence")}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateArticlesEquivalencesModal;
