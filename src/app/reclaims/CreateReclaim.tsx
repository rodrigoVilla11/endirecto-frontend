"use client";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { format } from "date-fns";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import {
  Status,
  useCreateReclaimMutation,
  Valid,
} from "@/redux/services/reclaimsApi";
import {
  useGetReclaimsTypesQuery,
  ReclaimType,
} from "@/redux/services/reclaimsTypes";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useClient } from "../context/ClientContext";
import {
  ActionType,
  StatusType,
  useCreateCrmMutation,
} from "@/redux/services/crmApi";
import {
  useAddNotificationToUsersByRolesMutation,
  Roles,
} from "@/redux/services/usersApi";

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
    useGetReclaimsTypesQuery();
  const { data: branchsData, isLoading: isLoadingBranchs } =
    useGetBranchesQuery(null);
  const { data: articlesData, isLoading: isLoadingArticles } =
    useGetAllArticlesQuery(null);
  const { data: customersData } = useGetCustomersQuery(null);

  const [createReclaim, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateReclaimMutation();
  const [createCrm] = useCreateCrmMutation();

  const [addNotificationToUsersByRoles] =
    useAddNotificationToUsersByRolesMutation();

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

  // Helper: texto de la notificación para ADMIN
  const buildReclaimNotificationText = (reclaim: any) => {
    const status = reclaim?.status ?? form.status ?? "—";
    const description = reclaim?.description ?? form.description ?? "—";

    const reclaimType = reclaimsTypesData?.find(
      (rt: ReclaimType) =>
        String(rt.id) ===
        String(reclaim.reclaims_type_id ?? form.reclaims_type_id)
    );
    const branch = branchsData?.find(
      (b: any) => String(b.id) === String(reclaim.branch_id ?? form.branch_id)
    );
    const article = articlesData?.find(
      (a: any) => String(a.id) === String(reclaim.article_id ?? form.article_id)
    );
    const customer = customersData?.find(
      (c: any) =>
        String(c.id) === String(reclaim.customer_id ?? form.customer_id)
    );

    const reclamoLabel = reclaimType
      ? `${reclaimType.categoria}${
          reclaimType.tipo ? ` - ${reclaimType.tipo}` : ""
        }`
      : String(reclaim.reclaims_type_id ?? form.reclaims_type_id ?? "—");

    const branchLabel = branch?.name ?? String(form.branch_id || "—");
    const articleLabel = article
      ? `${article.id}${article.name ? ` - ${article.name}` : ""}`
      : String(form.article_id || "—");

    const customerLabel = customer
      ? `${customer.id} - ${customer.name}`
      : String(form.customer_id || "—");

    const lines: string[] = [];
    lines.push(`Nuevo Reclamo`);
    lines.push(`Estado: PENDIENTE`);
    lines.push(`Cliente: ${customerLabel}`);
    lines.push(`Sucursal: ${branchLabel}`);
    lines.push(`Tipo de reclamo: ${reclamoLabel}`);
    lines.push(`Artículo: ${articleLabel}`);
    lines.push(`Descripción: ${description}`);

    return lines.join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...form,
        // mantiene tu formateo actual de fecha
        date: format(new Date(form.date), "dd/MM/yyyy HH:mm"),
      };

      // 1. Crear el reclamo
      const created = await createReclaim(formattedData).unwrap();

      // 2. Crear el registro en CRM de tipo "RECLAIM"
      const crmDate = getLocalISOStringWithOffset();
      await createCrm({
        date: crmDate,
        type: ActionType.RECLAIM,
        insitu: false,
        status: StatusType.PENDING,
        notes: `Reclaim creado. Descripción: ${form.description}`,
        collection_id: "",
        customer_id: form.customer_id,
        order_id: "",
        seller_id: userData?._id || "",
      }).unwrap();

      // 3. Notificar a todos los ADMINISTRADOR
      try {
        const now = new Date();
        const description = buildReclaimNotificationText(created);

        await addNotificationToUsersByRoles({
          roles: [Roles.ADMINISTRADOR],
          notification: {
            title: "Nuevo reclamo creado",
            type: "CONTACTO", // ajustá este valor si tu backend usa un enum específico
            description,
            link: "/reclaims", // o a detalle si lo tenés, ej: `/reclaims/${created._id}`
            schedule_from: now,
            schedule_to: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 días
          },
        }).unwrap();
      } catch (notifErr) {
        console.error(
          "No se pudo enviar notificación a ADMINISTRADOR:",
          notifErr
        );
      }

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
    <div className="bg-white rounded-xl p-4">
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
              reclaimsTypesData
                ?.filter((reclaimType: ReclaimType) => !reclaimType.deleted_at)
                .map((reclaimType: ReclaimType) => (
                  <option key={reclaimType.id} value={reclaimType.id}>
                    {reclaimType.categoria}
                    {reclaimType.tipo ? ` - ${reclaimType.tipo}` : ""}
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
            className={`rounded-md p-2 text-white ${
              isLoadingCreate ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isLoadingCreate}
          >
            {isLoadingCreate
              ? t("createReclaim.saving")
              : t("createReclaim.save")}
          </button>
        </div>

        {isSuccess && (
          <p className="text-green-500">{t("createReclaim.success")}</p>
        )}
        {isError && <p className="text-red-500">{t("createReclaim.error")}</p>}
      </form>
    </div>
  );
};

export default CreateReclaimComponent;
