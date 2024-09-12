import { useGetBrandsQuery } from '@/redux/services/brandsApi';
import { NotificationType, useCreateNotificationMutation } from '@/redux/services/notificationsApi';
import React, { useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { format } from 'date-fns'; // Importa la función 'format'

const CreateNotificationComponent = ({ closeModal }: { closeModal: () => void }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    link: '',
    type: NotificationType.NOVEDAD,
    brand_id: '',
    schedule_from_date: '',
    schedule_from_time: '',
    schedule_to_date: '',
    schedule_to_time: '',
  });

  const { data: brandsData, isLoading: isLoadingBrands } = useGetBrandsQuery(null);
  const [createNotification, { isLoading: isLoadingCreate, isSuccess, isError }] = useCreateNotificationMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        schedule_from: format(new Date(schedule_from), 'dd/MM/yyyy HH:mm'),
        schedule_to: format(new Date(schedule_to), 'dd/MM/yyyy HH:mm'),
      };

      await createNotification(formattedData).unwrap();
      closeModal();
    } catch (err) {
      console.error('Error al crear la Notification:', err);
    }
  };

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">New Notification</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className='flex gap-4'>
        <label className="flex flex-col">
          Title:
          <input
            name="title"
            value={form.title}
            placeholder="Notification Title"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Type:
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value={NotificationType.NOVEDAD}>Novedad</option>
            <option value={NotificationType.PEDIDO}>Pedido</option>
            <option value={NotificationType.PRESUPUESTO}>Presupuesto</option>
          </select>
        </label>

        <label className="flex flex-col">
          Brand:
          <select
            name="brand_id"
            value={form.brand_id}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">Select brand</option>
            {!isLoadingBrands && brandsData?.map((brand: { id: string; name: string }) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>
        </div>
        <div className='flex gap-4'>
        <label className="flex flex-col">
          Date From:
          <input
            type="date"
            name="schedule_from_date"
            value={form.schedule_from_date}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Hour From:
          <input
            type="time"
            name="schedule_from_time"
            value={form.schedule_from_time}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Date To:
          <input
            type="date"
            name="schedule_to_date"
            value={form.schedule_to_date}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Hour To:
          <input
            type="time"
            name="schedule_to_time"
            value={form.schedule_to_time}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>
        </div>
        
        <label className="flex flex-col">
          Description:
          <textarea
            name="description"
            value={form.description}
            placeholder="New description"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Link:
          <textarea
            name="link"
            value={form.link}
            placeholder="New link"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <div className="flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 rounded-md p-2 text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`rounded-md p-2 text-white ${isLoadingCreate ? 'bg-gray-500' : 'bg-success'}`}
            disabled={isLoadingCreate}
          >
            {isLoadingCreate ? 'Saving...' : 'Save'}
          </button>
        </div>

        {isSuccess && <p className="text-green-500">Notification created successfully!</p>}
        {isError && <p className="text-red-500">Error creating notification</p>}
      </form>
    </div>
  );
};

export default CreateNotificationComponent;
