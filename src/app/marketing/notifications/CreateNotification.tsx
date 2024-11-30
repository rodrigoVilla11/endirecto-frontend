import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import {
  NotificationType,
  useCreateNotificationMutation,
} from "@/redux/services/notificationsApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { format } from "date-fns";

const CreateNotificationComponent = ({
  closeModal,
}: {
  closeModal: () => void;
}) => {
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
  const [
    createNotification,
    { isLoading: isLoadingCreate, isSuccess, isError },
  ] = useCreateNotificationMutation();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prevForm) => ({
      ...prevForm,
      [e.target.name]: e.target.value,
    }));
  };

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
      console.error("Error creating notification:", err);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">New Notification</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>

      <form className="grid grid-cols-4 gap-4" onSubmit={handleSubmit}>
        {/* Title */}
        <label className="flex flex-col">
          Title:
          <input
            name="title"
            value={form.title}
            placeholder="Notification Title"
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
        </label>

        {/* Type */}
        <label className="flex flex-col">
          Type:
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          >
            <option value={NotificationType.NOVEDAD}>Novedad</option>
            <option value={NotificationType.PEDIDO}>Pedido</option>
            <option value={NotificationType.PRESUPUESTO}>Presupuesto</option>
          </select>
        </label>

        {/* Brand */}
        <label className="flex flex-col">
          Brand:
          <select
            name="brand_id"
            value={form.brand_id}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          >
            <option value="">Select brand</option>
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
          Date From:
          <input
            type="date"
            name="schedule_from_date"
            value={form.schedule_from_date}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
        </label>

        {/* Hour From */}
        <label className="flex flex-col">
          Hour From:
          <input
            type="time"
            name="schedule_from_time"
            value={form.schedule_from_time}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
        </label>

        {/* Date To */}
        <label className="flex flex-col">
          Date To:
          <input
            type="date"
            name="schedule_to_date"
            value={form.schedule_to_date}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
        </label>

        {/* Hour To */}
        <label className="flex flex-col">
          Hour To:
          <input
            type="time"
            name="schedule_to_time"
            value={form.schedule_to_time}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
        </label>

        {/* Description */}
        <label className="col-span-3 flex flex-col">
          Description:
          <textarea
            name="description"
            value={form.description}
            placeholder="New description"
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
        </label>

        {/* Link */}
        <label className="col-span-3 flex flex-col">
          Link:
          <textarea
            name="link"
            value={form.link}
            placeholder="New link"
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
        </label>

        {/* Buttons */}
        <div className="col-span-3 flex justify-end gap-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 text-white rounded-md p-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`bg-green-500 text-white rounded-md p-2 text-sm ${
              isLoadingCreate ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoadingCreate}
          >
            {isLoadingCreate ? "Saving..." : "Save"}
          </button>
        </div>

        {isSuccess && (
          <p className="text-green-500 col-span-3 text-sm">
            Notification created successfully!
          </p>
        )}
        {isError && (
          <p className="text-red-500 col-span-3 text-sm">
            Error creating notification
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateNotificationComponent;
