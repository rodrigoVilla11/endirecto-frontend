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
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">New CRM</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="flex flex-col gap-4">
          <label>
            Fecha:
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </label>
          <label>
            Notes:
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </label>
          <label>
            Estado:
            <select name="status" value={form.status} onChange={handleChange}>
              {Object.values(StatusType).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type:
            <select name="type" value={form.type} onChange={handleChange}>
              {Object.values(ActionType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col">
            Customer:
            <select
              name="customer_id"
              value={form.customer_id}
              onChange={handleChange}
              className="border border-black rounded-md p-2"
              disabled={!!selectedClientId}
            >
              <option value="">Select customer</option>
              {!isLoadingCustomers &&
                customersData?.map((customer: { id: string; name: string }) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col">
            Seller:
            <select
              name="seller_id"
              value={form.seller_id}
              onChange={handleChange}
              className="border border-black rounded-md p-2"
            >
              <option value="">Select seller</option>
              {!isLoadingSellers &&
                sellerData?.map((seller: { id: string; name: string }) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col">
            Collections:
            <select
              name="collection_id"
              value={form.collection_id}
              onChange={handleChange}
              className="border border-black rounded-md p-2"
            >
              <option value="">Select collection</option>
              {!isLoadingCollection &&
                collectionData?.map(
                  (collection: { _id: string; number: string }) => (
                    <option key={collection._id} value={collection._id}>
                      {collection._id}
                    </option>
                  )
                )}
            </select>
          </label>
          <label className="flex flex-col">
            User:
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              className="border border-black rounded-md p-2"
              disabled
            >
              <option value="">Select user</option>
              {!isLoadingUsers &&
                usersData?.map((user: { _id: string; username: string }) => (
                  <option key={user._id} value={user._id}>
                    {user.username}
                  </option>
                ))}
            </select>
          </label>
        </div>
        </div>
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
            className={`rounded-md p-2 text-white ${
              isLoadingCreate ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isLoadingCreate}
          >
            {isLoadingCreate ? "Saving..." : "Save"}
          </button>
        </div>
            
        {isSuccess && (
          <p className="text-green-500">Payment created successfully!</p>
        )}
        {isError && <p className="text-red-500">Error creating Payment</p>}
      
      </form>
    </div>
  );
};

export default CreateCRMComponent;
