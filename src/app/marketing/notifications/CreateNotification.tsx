"use client";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { format } from "date-fns";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
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
  });

  const { data: brandsData, isLoading: isLoadingBrands } = useGetBrandsQuery(null);
  const [createNotification, { isLoading: isLoadingCreate, isSuccess, isError }] = useCreateNotificationMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Construct schedule dates by concatenating date and time parts
      const schedule_from = `${form.schedule_from_date} ${form.schedule_from_time}`;
      const schedule_to = `${form.schedule_to_date} ${form.schedule_to_time}`;

      // Format dates to "yyyy-MM-dd HH:mm:ss"
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

      <form className="grid grid-cols-4 gap-4" onSubmit={handleSubmit}>
        {/* Title */}
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

        {/* Type */}
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
            <option value={NotificationType.PRESUPUESTO}>{t("createNotification.presupuesto")}</option>
          </select>
        </label>

        {/* Brand */}
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

        {/* Date From */}
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

        {/* Hour From */}
        <label className="flex flex-col">
          {t("createNotification.hourFromLabel")}:
          <input
            type="time"
            name="schedule_from_time"
            value={form.schedule_from_time}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
            required
          />
        </label>

        {/* Date To */}
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

        {/* Hour To */}
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

        {/* Description */}
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

        {/* Buttons */}
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
