"use client";
import React, { useState } from "react";
import { useGetAllArticlesQuery, useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import {
  Status,
  useCreateReclaimMutation,
  Valid,
} from "@/redux/services/reclaimsApi";
import { useGetReclaimsTypesQuery } from "@/redux/services/reclaimsTypes";
import { IoMdClose } from "react-icons/io";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useClient } from "../context/ClientContext";
import { useTranslation } from "react-i18next";

const CreateReclaimComponent = ({ closeModal }: any) => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const { selectedClientId } = useClient();

  const [form, setForm] = useState({
    reclaims_type_id: "",
    description: "",
    branch_id: "",
    customer_id: selectedClientId ? selectedClientId : "",
    article_id: "",
    valid: Valid.S,
    date: Date.now(),
    status: Status.PENDING,
    cause: "",
    user_id: userData?._id,
  });

  const { data: reclaimsTypesData, isLoading: isLoadingReclaimsTypes } =
    useGetReclaimsTypesQuery(null);
  const { data: branchsData, isLoading: isLoadingBranchs } =
    useGetBranchesQuery(null);
  const { data: customersData, isLoading: isLoadingCustomers } =
    useGetCustomersQuery(null);
  const { data: articlesData, isLoading: isLoadingArticles } =
    useGetAllArticlesQuery(null);

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

  const [createReclaim, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateReclaimMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...form,
        date: format(new Date(form.date), "dd/MM/yyyy HH:mm"),
      };

      await createReclaim(formattedData).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("createReclaim.errorCreating"), err);
    }
  };

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">{t("createReclaim.title")}</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col">
          {t("createReclaim.reclaimType")}:
          <select
            name="reclaims_type_id"
            value={form.reclaims_type_id}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">{t("createReclaim.selectReclaimType")}</option>
            {!isLoadingReclaimsTypes &&
              reclaimsTypesData?.map(
                (reclaimsTypes: { id: string; name: string }) => (
                  <option key={reclaimsTypes.id} value={reclaimsTypes.id}>
                    {reclaimsTypes.name}
                  </option>
                )
              )}
          </select>
        </label>

        <label className="flex flex-col">
          {t("createReclaim.description")}:
          <textarea
            name="description"
            value={form.description}
            placeholder={t("createReclaim.newDescription")}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          {t("createReclaim.article")}:
          <select
            name="article_id"
            value={form.article_id}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">{t("createReclaim.selectArticle")}</option>
            {!isLoadingArticles &&
              articlesData?.map((article: { id: string; name: string }) => (
                <option key={article.id} value={article.id}>
                  {article.name}
                </option>
              ))}
          </select>
        </label>

        <label className="flex flex-col">
          {t("createReclaim.branch")}:
          <select
            name="branch_id"
            value={form.branch_id}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">{t("createReclaim.selectBranch")}</option>
            {!isLoadingBranchs &&
              branchsData?.map((branch: { id: string; name: string }) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
          </select>
        </label>

        <div className="flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 rounded-md p-2 text-white"
          >
            {t("createReclaim.cancel")}
          </button>
          <button
            type="submit"
            className={`rounded-md p-2 text-white ${
              isLoadingCreate ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isLoadingCreate}
          >
            {isLoadingCreate ? t("createReclaim.saving") : t("createReclaim.save")}
          </button>
        </div>

        {isSuccess && (
          <p className="text-green-500">{t("createReclaim.success")}</p>
        )}
        {isError && (
          <p className="text-red-500">{t("createReclaim.error")}</p>
        )}
      </form>
    </div>
  );
};

export default CreateReclaimComponent;
