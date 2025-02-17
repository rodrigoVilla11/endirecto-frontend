"use client";
import React, { useState } from "react";
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
import { IoMdClose } from "react-icons/io";
import { useClient } from "../context/ClientContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const CreateCRMComponent = ({ closeModal }: { closeModal: () => void }) => {
  const { t } = useTranslation();
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const { selectedClientId } = useClient();
  const { userData } = useAuth();

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

  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery(null);
  const { data: sellerData, isLoading: isLoadingSellers } = useGetSellersQuery(null);
  const { data: collectionData, isLoading: isLoadingCollection } = useGetCollectionsQuery(null);
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(null);

  const [createCrm, { isLoading: isLoadingCreate, isSuccess, isError }] = useCreateCrmMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      console.error(t("errorCreatingCRM"), err);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t("newCRM")}</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("date")}</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("notes")}</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              />
            </div>
          </div>

          {/* Status and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("status")}</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              >
                {Object.values(StatusType).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("type")}</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              >
                {Object.values(ActionType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer and Seller */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("customer")}</label>
              <select
                name="customer_id"
                value={form.customer_id}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
                disabled={!!selectedClientId}
              >
                <option value="">{t("selectCustomer")}</option>
                {!isLoadingCustomers &&
                  customersData?.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("seller")}</label>
              <select
                name="seller_id"
                value={form.seller_id}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              >
                <option value="">{t("selectSeller")}</option>
                {!isLoadingSellers &&
                  sellerData?.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Collection and User */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("collection")}</label>
              <select
                name="collection_id"
                value={form.collection_id}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
              >
                <option value="">{t("selectCollection")}</option>
                {!isLoadingCollection &&
                  collectionData?.map((collection) => (
                    <option key={collection._id} value={collection._id}>
                      {collection._id}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("user")}</label>
              <select
                name="user_id"
                value={form.user_id}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-1 text-sm w-full"
                disabled
              >
                <option value="">{t("selectUser")}</option>
                {!isLoadingUsers &&
                  usersData?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))}
              </select>
            </div>
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
              className={`rounded-md px-3 py-1 text-sm text-white ${
                isLoadingCreate ? "bg-gray-500" : "bg-blue-600"
              }`}
              disabled={isLoadingCreate}
            >
              {isLoadingCreate ? t("saving") : t("save")}
            </button>
          </div>

          {isSuccess && (
            <p className="text-green-500 text-sm mt-2">{t("crmCreatedSuccessfully")}</p>
          )}
          {isError && (
            <p className="text-red-500 text-sm mt-2">{t("errorCreatingCRM")}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateCRMComponent;
