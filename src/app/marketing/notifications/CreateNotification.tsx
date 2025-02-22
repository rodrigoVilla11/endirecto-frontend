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

const CreateNotificationComponent: React.FC<CreateNotificationComponentProps> = ({ closeModal }) => {
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
  const { data: brandsData, isLoading: isLoadingBrands } = useGetBrandsQuery(null);
  const { data: articlesData, isLoading: isLoadingArticles } = useGetAllArticlesQuery(null);

  // Hook para crear notificación
  const [createNotification, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateNotificationMutation();

  // Manejo de cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
        ...form
      };

      await createNotification(formattedData).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("createNotification.errorLog"), err);
    }
  };

  // Filtrar artículos según la marca seleccionada
  const filteredArticles = articlesData && form.brand_id
    ? articlesData.filter((article: { id: string; name: string; brand_id: string }) => article.brand_id === form.brand_id)
    : [];

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{t("createNotification.title")}</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
          aria-label={t("createNotification.closeModal")}
        >
          <IoMdClose />
        </button>
      </div>

      {/* Toggle para notificación específica de artículo */}
      <div className="mb-4">
        <button
          type="button"
          onClick={toggleIsArticle}
          className="bg-purple-500 text-white px-3 py-1 rounded-md text-sm"
        >
          {t("createNotification.articleToggle")}: {isArticle ? t("createNotification.true") : t("createNotification.false")}
        </button>
      </div>

      {/* Select de artículos si se activa la opción */}
      {isArticle && (
        <div className="mb-4">
          <label className="flex flex-col">
            {t("createNotification.articleLabel")}:
            <select
              name="article_id"
              value={form.article_id}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm"
              required
              disabled={!form.brand_id}
            >
              <option value="">
                {!form.brand_id
                  ? t("createNotification.selectBrandFirst")
                  : t("createNotification.selectArticle")}
              </option>
              {!isLoadingArticles &&
                filteredArticles.map((article: { id: string; name: string }) => (
                  <option key={article.id} value={article.id}>
                    {article.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}

      <form className="grid grid-cols-4 gap-4" onSubmit={handleSubmit}>
        {/* Título */}
        <label className="flex flex-col">
          {t("createNotification.titleLabel")}:
          <input
            name="title"
            value={form.title}
            placeholder={t("createNotification.titlePlaceholder")}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
            required
          />
        </label>

        {/* Tipo */}
        <label className="flex flex-col">
          {t("createNotification.typeLabel")}:
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          >
            <option value={NotificationType.NOVEDAD}>{t("createNotification.novedad")}</option>
            <option value={NotificationType.PEDIDO}>{t("createNotification.pedido")}</option>
          </select>
        </label>

        {/* Marca */}
        <label className="flex flex-col">
          {t("createNotification.brandLabel")}:
          <select
            name="brand_id"
            value={form.brand_id}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
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
        </label>

        {/* Descripción */}
        <label className="col-span-3 flex flex-col">
          {t("createNotification.descriptionLabel")}:
          <textarea
            name="description"
            value={form.description}
            placeholder={t("createNotification.descriptionPlaceholder")}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
            required
          />
        </label>

        {/* Link */}
        <label className="col-span-3 flex flex-col">
          {t("createNotification.linkLabel")}:
          <textarea
            name="link"
            value={form.link}
            placeholder={t("createNotification.linkPlaceholder")}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
        </label>

        {/* Botones */}
        <div className="col-span-3 flex justify-end gap-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 text-white rounded-md px-3 py-1 text-sm"
          >
            {t("createNotification.cancel")}
          </button>
          <button
            type="submit"
            disabled={isLoadingCreate}
            className={`rounded-md px-3 py-1 text-sm text-white ${
              isLoadingCreate ? "bg-gray-500" : "bg-green-500"
            }`}
          >
            {isLoadingCreate ? t("createNotification.saving") : t("createNotification.save")}
          </button>
        </div>

        {isSuccess && (
          <p className="col-span-3 text-sm text-green-500">
            {t("createNotification.success")}
          </p>
        )}
        {isError && (
          <p className="col-span-3 text-sm text-red-500">
            {t("createNotification.error")}
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateNotificationComponent;

