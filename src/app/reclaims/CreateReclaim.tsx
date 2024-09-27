"use client";
import {
  useGetAllArticlesQuery,
  useGetArticlesQuery,
} from "@/redux/services/articlesApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import {
  Status,
  useCreateReclaimMutation,
  Valid,
} from "@/redux/services/reclaimsApi";
import { useGetReclaimsTypesQuery } from "@/redux/services/reclaimsTypes";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";

const CreateReclaimComponent = ({ closeModal }: any) => {
  const { userData } = useAuth();

  const [form, setForm] = useState({
    reclaims_type_id: "",
    description: "",
    branch_id: "",
    customer_id: "",
    article_id: "",
    valid: Valid.S,
    date: Date.now(),
    status: Status.PENDING,
    cause: "",
    user_id: userData?._id
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
      console.error("Error al crear la RECLAIM:", err);
    }
  };

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">New RECLAIM</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col">
          Reclaim Type:
          <select
            name="reclaims_type_id"
            value={form.reclaims_type_id}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">Select Reclaim Type</option>
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
          Description:
          <textarea
            name="description"
            value={form.description}
            placeholder="New Description"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>
        {/* 
        <label className="flex flex-col">
          Cause:
          <textarea
            name="cause"
            value={form.cause}
            placeholder="New cause"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label> */}

        <label className="flex flex-col">
          Article:
          <select
            name="article_id"
            value={form.article_id}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">Select Article</option>
            {!isLoadingArticles &&
              articlesData?.map((article: { id: string; name: string }) => (
                <option key={article.id} value={article.id}>
                  {article.name}
                </option>
              ))}
          </select>
        </label>

        <label className="flex flex-col">
          Branch:
          <select
            name="branch_id"
            value={form.branch_id}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">Select Branch</option>
            {!isLoadingBranchs &&
              branchsData?.map((branch: { id: string; name: string }) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
          </select>
        </label>

        {/* <label className="flex flex-col">
          Files:
          <textarea
            name="description"
            value={form.}
            placeholder="New Description"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label> */}

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
          <p className="text-green-500">RECLAIM created successfully!</p>
        )}
        {isError && <p className="text-red-500">Error creating RECLAIM</p>}
      </form>
    </div>
  );
};

export default CreateReclaimComponent;
