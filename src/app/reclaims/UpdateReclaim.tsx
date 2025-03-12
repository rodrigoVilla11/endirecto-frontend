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
  useGetCustomerByIdQuery,
  useGetCustomersQuery,
} from "@/redux/services/customersApi";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";
import { ReclaimType, useGetReclaimsTypesQuery } from "@/redux/services/reclaimsTypes";
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

  const { data: reclaimTypesData, isLoading: isLoadingReclaimsTypes } = useGetReclaimsTypesQuery();
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prevForm) => ({
      ...prevForm,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (selectedOption: any, field: string) => {
    setForm((prevForm) => ({
      ...prevForm,
      [field]: selectedOption ? selectedOption.value : "",
    }));
  };

  const toggleValid = () => {
    setForm((prevForm) => ({
      ...prevForm,
      valid: prevForm.valid === Valid.S ? Valid.N : Valid.S,
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

    const handleChangeReclaim = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      setForm((prevForm) => ({
        ...prevForm,
        [e.target.name]: e.target.value,
      }));
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
    <div className="bg-white shadow-xl rounded-lg p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-700">
          {t("updateReclaimComponent.header")}
        </h2>
        <button
          onClick={closeModal}
          className="text-gray-500 hover:text-gray-700 rounded-full h-8 w-8 flex justify-center items-center bg-gray-100 hover:bg-gray-200"
        >
          <IoMdClose size={20} />
        </button>
      </div>

      {/* Form */}
      <form
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        onSubmit={handleUpdate}
      >
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("updateReclaimComponent.reclaimType")}:
            </label>
            <select
              name="reclaims_type_id"
              value={form.reclaims_type_id}
              onChange={handleChangeReclaim}
              className="border border-black rounded-md p-2"
            >
              <option value="">{t("createReclaim.selectReclaimType")}</option>
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
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("updateReclaimComponent.description")}:
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="mt-1 border border-gray-300 rounded-lg p-3 text-sm shadow-sm focus:ring focus:ring-green-200"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("updateReclaimComponent.article")}:
            </label>
            <Select
              value={articleOptions.find(
                (option) => option.value === form.article_id
              )}
              onChange={(selectedOption) =>
                handleSelectChange(selectedOption, "article_id")
              }
              options={articleOptions}
              className="mt-1 border-gray-300 rounded-lg shadow-sm"
            />
          </div>
        </div>

        {/* Middle Column */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("updateReclaimComponent.branch")}:
            </label>
            <Select
              value={branchOptions.find(
                (option) => option.value === form.branch_id
              )}
              onChange={(selectedOption) =>
                handleSelectChange(selectedOption, "branch_id")
              }
              options={branchOptions}
              className="mt-1 border-gray-300 rounded-lg shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("updateReclaimComponent.customer")}:
            </label>
            <Select
              value={customerOptions.find(
                (option) => option.value === form.customer_id
              )}
              onChange={(selectedOption) =>
                handleSelectChange(selectedOption, "customer_id")
              }
              options={customerOptions}
              className="mt-1 border-gray-300 rounded-lg shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("updateReclaimComponent.date")}:
            </label>
            <input
              type="text"
              name="date"
              value={form.date}
              readOnly
              className="mt-1 border border-gray-300 rounded-lg p-3 text-sm shadow-sm bg-gray-50"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("updateReclaimComponent.cause")}:
            </label>
            <input
              type="text"
              name="cause"
              value={form.cause}
              onChange={handleChange}
              className="mt-1 border border-gray-300 rounded-lg p-3 text-sm shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("updateReclaimComponent.solution")}:
            </label>
            <input
              type="text"
              name="solution"
              value={form.solution}
              onChange={handleChange}
              className="mt-1 border border-gray-300 rounded-lg p-3 text-sm shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("updateReclaimComponent.internalSolution")}:
            </label>
            <input
              type="text"
              name="internal_solution"
              value={form.internal_solution}
              onChange={handleChange}
              className="mt-1 border border-gray-300 rounded-lg p-3 text-sm shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("updateReclaimComponent.valid")}:
            </label>
            <button
              type="button"
              onClick={toggleValid}
              className={`p-3 rounded-lg text-sm shadow-sm ${
                form.valid === Valid.S
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {form.valid === Valid.S
                ? t("updateReclaimComponent.validLabel")
                : t("updateReclaimComponent.invalidLabel")}
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="col-span-1 md:col-span-3 flex justify-end items-end gap-4 mt-6">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 text-white rounded-lg p-3 text-sm hover:bg-gray-500"
          >
            {t("updateReclaimComponent.cancel")}
          </button>
          <button
            type="submit"
            className="bg-green-500 text-white rounded-lg p-3 text-sm hover:bg-green-600"
            disabled={isUpdating}
          >
            {isUpdating
              ? t("updateReclaimComponent.updating")
              : t("updateReclaimComponent.update")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateReclaimComponent;
