"use client";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { format, addDays, addMonths } from "date-fns";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
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
    schedule_from_date: "",
    schedule_from_time: "",
    schedule_to_date: "",
    schedule_to_time: "",
    customer_id: "",
    article_id: "",
  });

  // Estado para notificación específica de cliente y artículo
  const [isCustomer, setIsCustomer] = useState(false);
  const [isArticle, setIsArticle] = useState(false);
  // Estado para la opción relativa seleccionada (por defecto vacío)
  const [relativeDuration, setRelativeDuration] = useState("");

  // Obtener marcas, clientes y artículos
  const { data: brandsData, isLoading: isLoadingBrands } = useGetBrandsQuery(null);
  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery(null);
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

  // Toggle para activar/desactivar notificación por cliente
  const toggleIsCustomer = () => {
    setIsCustomer((prev) => !prev);
    if (isCustomer) {
      setForm((prev) => ({ ...prev, customer_id: "" }));
    }
  };

  // Toggle para activar/desactivar notificación por artículo
  const toggleIsArticle = () => {
    setIsArticle((prev) => !prev);
    if (isArticle) {
      setForm((prev) => ({ ...prev, article_id: "" }));
    }
  };

  // Función para establecer fecha y hora actuales en schedule_from
  const setNowAsScheduleFrom = () => {
    const now = new Date();
    const currentDate = format(now, "yyyy-MM-dd");
    const currentTime = format(now, "HH:mm");
    setForm((prev) => ({
      ...prev,
      schedule_from_date: currentDate,
      schedule_from_time: currentTime,
    }));
  };

  // Función para calcular schedule_to a partir de schedule_from y la duración relativa
  const handleRelativeDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRelativeDuration(value);

    // Solo se calcula si ya se tiene definida la fecha y hora de schedule_from
    if (form.schedule_from_date && form.schedule_from_time) {
      const fromDateTime = new Date(`${form.schedule_from_date} ${form.schedule_from_time}`);
      let toDate: Date;
      switch (value) {
        case "24h":
          toDate = addDays(fromDateTime, 1);
          break;
        case "48h":
          toDate = addDays(fromDateTime, 2);
          break;
        case "1w":
          toDate = addDays(fromDateTime, 7);
          break;
        case "2w":
          toDate = addDays(fromDateTime, 14);
          break;
        case "1m":
          toDate = addMonths(fromDateTime, 1);
          break;
        default:
          return;
      }
      setForm((prev) => ({
        ...prev,
        schedule_to_date: format(toDate, "yyyy-MM-dd"),
        schedule_to_time: format(toDate, "HH:mm"),
      }));
    }
  };

  // Manejo del submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const schedule_from = `${form.schedule_from_date} ${form.schedule_from_time}`;
      const schedule_to = `${form.schedule_to_date} ${form.schedule_to_time}`;

      const formattedData = {
        ...form,
        schedule_from: format(new Date(schedule_from), "yyyy-MM-dd HH:mm:ss"),
        schedule_to: format(new Date(schedule_to), "yyyy-MM-dd HH:mm:ss"),
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

      {/* Toggle para notificación específica por cliente */}
      <div className="mb-4">
        <button
          type="button"
          onClick={toggleIsCustomer}
          className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
        >
          {t("createNotification.customerToggle")}: {isCustomer ? t("createNotification.true") : t("createNotification.false")}
        </button>
      </div>

      {/* Select de clientes si se activa la opción */}
      {isCustomer && (
        <div className="mb-4">
          <label className="flex flex-col">
            {t("createNotification.customerLabel")}:
            <select
              name="customer_id"
              value={form.customer_id}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm"
              required
            >
              <option value="">{t("createNotification.selectCustomer")}</option>
              {!isLoadingCustomers &&
                customersData?.map((customer: { id: string; name: string }) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}

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

        {/* Fecha Desde */}
        <label className="flex flex-col">
          {t("createNotification.dateFromLabel")}:
          <input
            type="date"
            name="schedule_from_date"
            value={form.schedule_from_date}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
            required
          />
        </label>

        {/* Hora Desde con botón "Ahora" */}
        <label className="flex flex-col relative">
          {t("createNotification.hourFromLabel")}:
          <input
            type="time"
            name="schedule_from_time"
            value={form.schedule_from_time}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
            required
          />
          <button
            type="button"
            onClick={setNowAsScheduleFrom}
            className="absolute right-0 top-0 bg-green-500 text-white px-2 py-1 rounded-md text-xs"
          >
            {t("createNotification.now")}
          </button>
        </label>

        {/* Select para duración relativa */}
        <label className="flex flex-col">
          {t("createNotification.relativeDurationLabel")}:
          <select
            name="relativeDuration"
            value={relativeDuration}
            onChange={handleRelativeDurationChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          >
            <option value="">{t("createNotification.selectDuration")}</option>
            <option value="24h">{t("createNotification.duration24h")}</option>
            <option value="48h">{t("createNotification.duration48h")}</option>
            <option value="1w">{t("createNotification.duration1w")}</option>
            <option value="2w">{t("createNotification.duration2w")}</option>
            <option value="1m">{t("createNotification.duration1m")}</option>
          </select>
        </label>

        {/* Fecha Hasta */}
        <label className="flex flex-col">
          {t("createNotification.dateToLabel")}:
          <input
            type="date"
            name="schedule_to_date"
            value={form.schedule_to_date}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
            required
          />
        </label>

        {/* Hora Hasta */}
        <label className="flex flex-col">
          {t("createNotification.hourToLabel")}:
          <input
            type="time"
            name="schedule_to_time"
            value={form.schedule_to_time}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
            required
          />
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

