"use client";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { format } from "date-fns";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { Status, useCreateReclaimMutation, Valid } from "@/redux/services/reclaimsApi";
import { useGetReclaimsTypesQuery } from "@/redux/services/reclaimsTypes";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useClient } from "../context/ClientContext";
// Importar el hook de CRM
import { ActionType, StatusType, useCreateCrmMutation } from "@/redux/services/crmApi";

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

  const { data: reclaimsTypesData, isLoading: isLoadingReclaimsTypes } = useGetReclaimsTypesQuery(null);
  const { data: branchsData, isLoading: isLoadingBranchs } = useGetBranchesQuery(null);
  const { data: articlesData, isLoading: isLoadingArticles } = useGetAllArticlesQuery(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prevForm) => ({
      ...prevForm,
      [e.target.name]: e.target.value,
    }));
  };

  const [createReclaim, { isLoading: isLoadingCreate, isSuccess, isError }] = useCreateReclaimMutation();
  // Hook para crear CRM
  const [createCrm] = useCreateCrmMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...form,
        date: format(new Date(form.date), "dd/MM/yyyy HH:mm"),
      };

      // 1. Crear el reclaim
      const createdReclaim = await createReclaim(formattedData).unwrap();

      // 2. Crear el registro en CRM de tipo "RECLAIM"
      const crmDate = getLocalISOStringWithOffset();
      await createCrm({
        date: crmDate,
        type: ActionType.RECLAIM,
        insitu: false, // No aplica para reclamación
        status: StatusType.PENDING, // O el status que corresponda
        notes: `Reclaim creado. Descripción: ${form.description}`,
        collection_id: "",
        customer_id: form.customer_id,
        order_id: "", // No aplica para reclamación
        seller_id: userData?._id || "",
      }).unwrap();

      closeModal();
    } catch (err) {
      console.error(t("createReclaim.errorCreating"), err);
    }
  };

  function getLocalISOStringWithOffset(): string {
    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
    const offsetMinutes = pad(Math.abs(offset) % 60);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${sign}${offsetHours}:${offsetMinutes}`;
  }

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
              reclaimsTypesData?.map((reclaimType: { id: string; name: string }) => (
                <option key={reclaimType.id} value={reclaimType.id}>
                  {reclaimType.name}
                </option>
              ))}
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
                  {article.id}
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
            className={`rounded-md p-2 text-white ${isLoadingCreate ? "bg-gray-500" : "bg-success"}`}
            disabled={isLoadingCreate}
          >
            {isLoadingCreate ? t("createReclaim.saving") : t("createReclaim.save")}
          </button>
        </div>

        {isSuccess && <p className="text-green-500">{t("createReclaim.success")}</p>}
        {isError && <p className="text-red-500">{t("createReclaim.error")}</p>}
      </form>
    </div>
  );
};

export default CreateReclaimComponent;
