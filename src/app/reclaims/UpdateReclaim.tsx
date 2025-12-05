"use client";
import React, { useEffect, useState } from "react";
import {
  Status,
  useGetReclaimByIdQuery,
  useUpdateReclaimMutation,
  Valid,
} from "@/redux/services/reclaimsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import {
  useGetCustomersQuery,
} from "@/redux/services/customersApi";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";
import {
  ReclaimType,
  useGetReclaimsTypesQuery,
} from "@/redux/services/reclaimsTypes";
import Select from "react-select";
import { IoMdClose } from "react-icons/io";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

type UpdateReclaimComponentProps = {
  reclaimId: string;
  closeModal: () => void;
};

const UpdateReclaimComponent = ({
  reclaimId,
  closeModal,
}: UpdateReclaimComponentProps) => {
  const { t } = useTranslation();
  const { userData } = useAuth();

  const {
    data: reclaim,
    error,
    isLoading,
  } = useGetReclaimByIdQuery({ id: reclaimId });

  const [updateReclaim, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateReclaimMutation();

  const [form, setForm] = useState({
    _id: "",
    reclaims_type_id: "",
    description: "",
    branch_id: "",
    customer_id: "",
    article_id: "",
    valid: Valid.S,
    date: "",
    status: Status.PENDING,
    cause: "",
    solution: "",
    internal_solution: "",
    date_solved: "",
    user_solved_id: userData?._id || "",
  });

  const { data: reclaimTypesData, isLoading: isLoadingReclaimsTypes } =
    useGetReclaimsTypesQuery();
  const { data: branchesData } = useGetBranchesQuery(null);
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: articlesData } = useGetAllArticlesQuery(null);

  useEffect(() => {
    if (reclaim) {
      setForm({
        _id: reclaim._id,
        reclaims_type_id: reclaim.reclaims_type_id,
        description: reclaim.description,
        branch_id: reclaim.branch_id,
        customer_id: reclaim.customer_id,
        article_id: reclaim.article_id,
        valid: reclaim.valid as Valid,
        date: reclaim.date,
        status: reclaim.status as Status,
        cause: reclaim.cause || "",
        solution: reclaim.public_solution || "",
        internal_solution: reclaim.internal_solution || "",
        date_solved: "",
        user_solved_id: userData?._id || "",
      });
    }
  }, [reclaim, userData]);

  // Este handleChange ahora se usa SOLO en Gestión y Resolución
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prevForm) => ({
      ...prevForm,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateReclaim(form).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("updateReclaimComponent.errorUpdating"), err);
    }
  };

  const branchOptions =
    branchesData?.map((branch: { id: string; name: string }) => ({
      value: branch.id,
      label: branch.name,
    })) || [];

  const customerOptions =
    customersData?.map((customer: { id: string; name: string }) => ({
      value: customer.id,
      label: customer.name,
    })) || [];

  const articleOptions =
    articlesData?.map((article: { id: string; name: string }) => ({
      value: article.id,
      label: article.name,
    })) || [];

  if (isLoading) return <p>{t("updateReclaimComponent.loading")}</p>;
  if (error) return <p>{t("updateReclaimComponent.errorLoading")}</p>;

  return (
    <div className="bg-white shadow-xl rounded-2xl max-w-5xl mx-auto max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800">
            {t("updateReclaimComponent.header")}
          </h2>
          {form._id && (
            <p className="text-xs text-gray-500 mt-1">
              ID:{" "}
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                {form._id}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={closeModal}
          className="text-gray-500 hover:text-gray-700 rounded-full h-8 w-8 flex justify-center items-center bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <IoMdClose size={20} />
        </button>
      </div>

      {/* Body scrollable */}
      <form
        className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        onSubmit={handleUpdate}
      >
        {/* Estado + Validez (SOLO LECTURA) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {t("updateReclaimComponent.status") ?? "Estado"}:
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                form.status === Status.PENDING
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {t(`updateReclaimComponent.statusLabels.${form.status}`)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {t("updateReclaimComponent.valid")}:
            </span>
            {/* Píldora solo lectura, sin botón */}
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                form.valid === Valid.S
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {form.valid === Valid.S
                ? t("updateReclaimComponent.validLabel")
                : t("updateReclaimComponent.invalidLabel")}
            </span>
          </div>
        </div>

        {/* Sección 1: Información principal (SOLO LECTURA) */}
        <div className="border border-gray-100 rounded-xl p-4 md:p-5 bg-gray-50/60 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">
            {t("updateReclaimComponent.mainInfo") ?? "Información del reclamo"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de reclamo */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("updateReclaimComponent.reclaimType")}:
              </label>
              <select
                name="reclaims_type_id"
                value={form.reclaims_type_id}
                disabled
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
              >
                <option value="">
                  {t("createReclaim.selectReclaimType")}
                </option>
                {!isLoadingReclaimsTypes &&
                  reclaimTypesData
                    ?.filter(
                      (reclaimType: ReclaimType) => !reclaimType.deleted_at
                    )
                    .map((reclaimType: ReclaimType) => (
                      <option key={reclaimType.id} value={reclaimType.id}>
                        {reclaimType.categoria}
                        {reclaimType.tipo ? ` - ${reclaimType.tipo}` : ""}
                      </option>
                    ))}
              </select>
            </div>

            {/* Sucursal */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("updateReclaimComponent.branch")}:
              </label>
              <Select
                value={branchOptions.find(
                  (option) => option.value === form.branch_id
                )}
                isDisabled
                options={branchOptions}
                className="text-sm"
                classNamePrefix="react-select"
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("updateReclaimComponent.customer")}:
              </label>
              <Select
                value={customerOptions.find(
                  (option) => option.value === form.customer_id
                )}
                isDisabled
                options={customerOptions}
                className="text-sm"
                classNamePrefix="react-select"
              />
            </div>

            {/* Artículo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("updateReclaimComponent.article")}:
              </label>
              <Select
                value={articleOptions.find(
                  (option) => option.value === form.article_id
                )}
                isDisabled
                options={articleOptions}
                className="text-sm"
                classNamePrefix="react-select"
              />
            </div>

            {/* Fecha creación */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("updateReclaimComponent.date")}:
              </label>
              <input
                type="text"
                name="date"
                value={form.date}
                readOnly
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-100 text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Descripción (SOLO LECTURA) */}
        <div className="border border-gray-100 rounded-xl p-4 md:p-5 bg-white space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">
            {t("updateReclaimComponent.descriptionSection") ??
              "Descripción del reclamo"}
          </h3>
          <textarea
            name="description"
            value={form.description}
            readOnly
            className="w-full border border-gray-200 rounded-lg p-3 text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* Sección 3: Gestión y resolución (EDITABLE) */}
        <div className="border border-gray-100 rounded-xl p-4 md:p-5 bg-white space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">
            {t("updateReclaimComponent.resolutionSection") ??
              "Gestión y resolución"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Causa */}
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("updateReclaimComponent.cause")}:
              </label>
              <input
                type="text"
                name="cause"
                value={form.cause}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm shadow-sm focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              />
            </div>

            {/* Solución pública */}
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("updateReclaimComponent.solution")}:
              </label>
              <input
                type="text"
                name="solution"
                value={form.solution}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm shadow-sm focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              />
            </div>

            {/* Solución interna */}
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("updateReclaimComponent.internalSolution")}:
              </label>
              <input
                type="text"
                name="internal_solution"
                value={form.internal_solution}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm shadow-sm focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            {t("updateReclaimComponent.cancel")}
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isUpdating}
          >
            {isUpdating
              ? t("updateReclaimComponent.updating")
              : t("updateReclaimComponent.update")}
          </button>
        </div>

        {isSuccess && (
          <p className="text-xs text-emerald-600 mt-1">
            {t("updateReclaimComponent.success") ??
              "Reclamo actualizado correctamente."}
          </p>
        )}
        {isError && (
          <p className="text-xs text-red-600 mt-1">
            {t("updateReclaimComponent.error") ??
              "Ocurrió un error al actualizar el reclamo."}
          </p>
        )}
      </form>
    </div>
  );
};

export default UpdateReclaimComponent;
