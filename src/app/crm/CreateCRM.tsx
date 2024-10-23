"use client";
import { useGetCollectionsQuery } from "@/redux/services/collectionsApi";
import {
  ActionType,
  StatusType,
  useCreateCrmMutation,
} from "@/redux/services/crmApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetUsersQuery } from "@/redux/services/usersApi";
import { format } from "date-fns";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useClient } from "../context/ClientContext";
import { useAuth } from "../context/AuthContext";

const CreateCRMComponent = ({ closeModal }: { closeModal: () => void }) => {
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const { selectedClientId } = useClient();
  const { userData } = useAuth();
  console.log("selectedId", selectedClientId)
  const [form, setForm] = useState({
    date: currentDate,
    type: ActionType.CALL,
    status: StatusType.PENDING,
    notes: "",
    collection_id: "",
    customer_id: selectedClientId ? selectedClientId : "",
    order_id: "",
    seller_id: "",
    user_id: userData ? userData?._id : "",
  });
  console.log(form)
  const { data: customersData, isLoading: isLoadingCustomers } =
    useGetCustomersQuery(null);
  const { data: sellerData, isLoading: isLoadingSellers } =
    useGetSellersQuery(null);
  //   const { data: ordersData, isLoading: isLoadingOrders } =
  //   useGetOrdersQuery(null);
  const { data: collectionData, isLoading: isLoadingCollection } =
    useGetCollectionsQuery(null);
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(null);

  const [createCrm, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateCrmMutation();
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
      await createCrm(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error al crear la colección:", err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-lg">
  <div className="flex justify-between items-center">
    <h2 className="text-xl font-semibold">Nuevo CRM</h2>
    <button
      onClick={closeModal}
      className="text-gray-500 hover:text-gray-700"
    >
      <IoMdClose className="w-6 h-6" />
    </button>
  </div>

  <form onSubmit={handleSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Fecha:
        </label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Notas:
        </label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 w-full"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Estado:
        </label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 w-full"
        >
          {Object.values(StatusType).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo:
        </label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 w-full"
        >
          {Object.values(ActionType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Cliente:
        </label>
        <select
          name="customer_id"
          value={form.customer_id}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 w-full"
          disabled={!!selectedClientId}
        >
          <option value="">Selecciona un cliente</option>
          {!isLoadingCustomers &&
            customersData?.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Vendedor:
        </label>
        <select
          name="seller_id"
          value={form.seller_id}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 w-full"
        >
          <option value="">Selecciona un vendedor</option>
          {!isLoadingSellers &&
            sellerData?.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Colección:
        </label>
        <select
          name="collection_id"
          value={form.collection_id}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 w-full"
        >
          <option value="">Selecciona una colección</option>
          {!isLoadingCollection &&
            collectionData?.map((collection) => (
              <option key={collection._id} value={collection._id}>
                {collection._id}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Usuario:
        </label>
        <select
          name="user_id"
          value={form.user_id}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 w-full"
          disabled
        >
          <option value="">Selecciona un usuario</option>
          {!isLoadingUsers &&
            usersData?.map((user) => (
              <option key={user._id} value={user._id}>
                {user.username}
              </option>
            ))}
        </select>
      </div>
    </div>

    <div className="flex justify-end gap-4 mt-6">
      <button
        type="button"
        onClick={closeModal}
        className="bg-gray-300 text-gray-700 rounded-md px-4 py-2"
      >
        Cancelar
      </button>
      <button
        type="submit"
        className={`rounded-md px-4 py-2 text-white ${
          isLoadingCreate ? "bg-gray-500" : "bg-green-500"
        }`}
        disabled={isLoadingCreate}
      >
        {isLoadingCreate ? "Guardando..." : "Guardar"}
      </button>
    </div>
  </form>
</div>
  );
};

export default CreateCRMComponent;
