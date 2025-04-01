"use client";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { format, addDays, addMonths } from "date-fns";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi"; // Hook de artículos
import {
  NotificationType,
  useCreateNotificationMutation,
} from "@/redux/services/notificationsApi";
import { useTranslation } from "react-i18next";

interface CreateNotificationComponentProps {
  closeModal: () => void;
}

const CreateNotificationComponent: React.FC<
  CreateNotificationComponentProps
> = ({ closeModal }) => {
  const { t } = useTranslation();

  // Estado del formulario (se agregan customer_id y article_id)
  const [form, setForm] = useState({
    title: "",
    description: "",
    link: "",
    type: NotificationType.NOVEDAD,
    brand_id: "",
    article_id: "",
  });

  const [isArticle, setIsArticle] = useState(false);
  // Estado para la opción relativa seleccionada (por defecto vacío)
  const [relativeDuration, setRelativeDuration] = useState("");

  // Obtener marcas, clientes y artículos
  const { data: brandsData, isLoading: isLoadingBrands } =
    useGetBrandsQuery(null);
  const { data: articlesData, isLoading: isLoadingArticles } =
    useGetAllArticlesQuery(null);

  // Hook para crear notificación
  const [
    createNotification,
    { isLoading: isLoadingCreate, isSuccess, isError },
  ] = useCreateNotificationMutation();

  // Manejo de cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Toggle para activar/desactivar notificación por artículo
  const toggleIsArticle = () => {
    setIsArticle((prev) => !prev);
    if (isArticle) {
      setForm((prev) => ({ ...prev, article_id: "" }));
    }
  };

  // Manejo del submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formattedData = {
        ...form,
      };

      await createNotification(formattedData).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("createNotification.errorLog"), err);
    }
  };

  // Filtrar artículos según la marca seleccionada
  const filteredArticles =
    articlesData && form.brand_id
      ? articlesData.filter(
          (article: { id: string; name: string; brand_id: string }) =>
            article.brand_id === form.brand_id
        )
      : [];

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800">{t("createNotification.title")}</h2>
        <button
          onClick={closeModal}
          className="text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-full h-8 w-8 flex justify-center items-center transition-colors"
          aria-label={t("createNotification.closeModal")}
        >
          <IoMdClose className="h-5 w-5" />
        </button>
      </div>

      {/* Article notification toggle with improved styling */}
      <div className="mb-6">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-3">{t("createNotification.articleToggle")}</span>
          <button
            type="button"
            onClick={toggleIsArticle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              isArticle ? "bg-primary" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isArticle ? "translate-x-6" : "translate-x-1"
              }`}
            />
            <span className="sr-only">{isArticle ? t("createNotification.true") : t("createNotification.false")}</span>
          </button>
          <span className="ml-2 text-sm text-gray-500">
            {isArticle ? t("createNotification.true") : t("createNotification.false")}
          </span>
        </div>
      </div>

      {/* Article selection section with improved styling */}
      {isArticle && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-primary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("createNotification.brandLabel")}
              </label>
              <select
                name="brand_id"
                value={form.brand_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                required
              >
                <option value="">{t("createNotification.selectBrand")}</option>
                {!isLoadingBrands &&
                  brandsData?.map((brand: { id: string; name: string }) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
              </select>
              {isLoadingBrands && (
                <div className="mt-1 text-sm text-gray-500">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse rounded-full w-1/3"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Article */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("createNotification.articleLabel")}
              </label>
              <select
                name="article_id"
                value={form.article_id}
                onChange={handleChange}
                className={`w-full border rounded-md py-2 px-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  !form.brand_id ? "bg-gray-50 border-gray-200 text-gray-400" : "border-gray-300"
                }`}
                required
                disabled={!form.brand_id}
              >
                <option value="">
                  {!form.brand_id ? t("createNotification.selectBrandFirst") : t("createNotification.selectArticle")}
                </option>
                {!isLoadingArticles &&
                  filteredArticles.map((article: { id: string; name: string }) => (
                    <option key={article.id} value={article.id}>
                      {article.name}
                    </option>
                  ))}
              </select>
              {isLoadingArticles && form.brand_id && (
                <div className="mt-1 text-sm text-gray-500">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse rounded-full w-1/3"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Title */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("createNotification.titleLabel")}</label>
            <input
              name="title"
              value={form.title}
              placeholder={t("createNotification.titlePlaceholder")}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              required
            />
          </div>

          {/* Type */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("createNotification.typeLabel")}</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:primary focus:border-transparent transition-colors"
            >
              <option value={NotificationType.NOVEDAD}>{t("createNotification.novedad")}</option>
              <option value={NotificationType.PEDIDO}>{t("createNotification.pedido")}</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("createNotification.descriptionLabel")}
          </label>
          <textarea
            name="description"
            value={form.description}
            placeholder={t("createNotification.descriptionPlaceholder")}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors min-h-[100px]"
            required
          />
        </div>

        {/* Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("createNotification.linkLabel")}</label>
          <textarea
            name="link"
            value={form.link}
            placeholder={t("createNotification.linkPlaceholder")}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
        </div>

        {/* Status messages */}
        <div className="min-h-[24px]">
          {isSuccess && (
            <div className="flex items-center text-green-600 text-sm">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                ></path>
              </svg>
              {t("createNotification.success")}
            </div>
          )}
          {isError && (
            <div className="flex items-center text-red-600 text-sm">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                ></path>
              </svg>
              {t("createNotification.error")}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            {t("createNotification.cancel")}
          </button>
          <button
            type="submit"
            disabled={isLoadingCreate}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              isLoadingCreate
                ? "bg-primary cursor-not-allowed"
                : "bg-secondary hover:bg-secondary focus:ring-primary"
            }`}
          >
            {isLoadingCreate ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t("createNotification.saving")}
              </span>
            ) : (
              t("createNotification.save")
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNotificationComponent;
