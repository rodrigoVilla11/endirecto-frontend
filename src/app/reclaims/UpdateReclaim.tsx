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
import { useGetReclaimsTypesQuery } from "@/redux/services/reclaimsTypes";
import { useGetSellerByIdQuery } from "@/redux/services/sellersApi";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import Select from "react-select"; // Correct import for react-select
import { IoMdClose } from "react-icons/io";

type UpdateReclaimComponentProps = {
  reclaimId: string;
  closeModal: () => void;
};

const UpdateReclaimComponent = ({
  reclaimId,
  closeModal,
}: UpdateReclaimComponentProps) => {
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
    user_solved_id: userData ? userData?._id : "",
  });

  const { data: reclaimTypesData, isLoading: isLoadingReclaimTypes } =
    useGetReclaimsTypesQuery(null);
  const { data: branchesData, isLoading: isLoadingBranches } =
    useGetBranchesQuery(null);
  const { data: customerData, isLoading: isLoadingCustomer } =
    useGetCustomerByIdQuery({ id: form.customer_id });
  const { data: articlesData, isLoading: isLoadingArticles } =
    useGetAllArticlesQuery(null);
  const { data: sellerData, isLoading: isLoadingSeller } =
    useGetSellerByIdQuery(
      { id: customerData?.seller_id || "" },
      { skip: !customerData }
    );

  const { data: customersData, isLoading: isLoadingCustomers } =
    useGetCustomersQuery(null);

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
        date_solved: format(new Date(Date.now()), "dd/MM/yyyy HH:mm"),
        user_solved_id: userData?._id || "",
      });
    }
  }, [reclaim, userData]);

  const handleChange = (e: any) => {
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateReclaim(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating RECLAIM:", err);
    }
  };

  const toggleValid = () => {
    setForm((prevForm) => ({
      ...prevForm,
      valid: prevForm.valid === Valid.S ? Valid.N : Valid.S,
    }));
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const reclaimTypeOptions =
    reclaimTypesData?.map((type: { id: string; name: string }) => ({
      value: type.id,
      label: type.name,
    })) || [];

  const articleOptions =
    articlesData?.map((article: { id: string; name: string }) => ({
      value: article.id,
      label: article.name,
    })) || [];

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

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
    <div className=" flex justify-between">
      <h2 className="text-lg font-bold mb-4">Update RECLAIM</h2>
      <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <form className="grid grid-cols-2 gap-6 " onSubmit={handleUpdate}>
        <div>
          {/* Reclaim Type */}
          <label className="block mb-2">
            Reclaim Type:
            <Select
              value={reclaimTypeOptions.find(
                (option) => option.value === form.reclaims_type_id
              )}
              onChange={(selectedOption) =>
                handleSelectChange(selectedOption, "reclaims_type_id")
              }
              options={reclaimTypeOptions}
              className="mt-1"
            />
          </label>

          {/* Description */}
          <label className="block mb-2">
            Description:
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 mt-1 w-full"
            />
          </label>

          {/* Article */}
          <label className="block mb-2">
            Article:
            <Select
              value={articleOptions.find(
                (option) => option.value === form.article_id
              )}
              onChange={(selectedOption) =>
                handleSelectChange(selectedOption, "article_id")
              }
              options={articleOptions}
              className="mt-1"
            />
          </label>

          {/* Branch */}
          <label className="block mb-2">
            Branch:
            <Select
              value={branchOptions.find(
                (option) => option.value === form.branch_id
              )}
              onChange={(selectedOption) =>
                handleSelectChange(selectedOption, "branch_id")
              }
              options={branchOptions}
              className="mt-1"
            />
          </label>

          {/* Customer */}
          <label className="block mb-2">
            Customer:
            <Select
              value={customerOptions.find(
                (option) => option.value === form.customer_id
              )}
              onChange={(selectedOption) =>
                handleSelectChange(selectedOption, "customer_id")
              }
              options={customerOptions}
              className="mt-1"
            />
          </label>
        </div>

        <div>
          {/* Date */}
          <label className="block mb-2">
            Date:
            <input
              type="text"
              name="date"
              value={form.date}
              readOnly
              disabled
              className="border border-gray-300 rounded-md p-2 mt-1 w-full"
            />
          </label>

          {/* Cause */}
          <label className="block mb-2">
            Cause:
            <input
              type="text"
              name="cause"
              value={form.cause}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 mt-1 w-full"
            />
          </label>

          {/* Solution */}
          <label className="block mb-2">
            Solution:
            <input
              type="text"
              name="solution"
              value={form.solution}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 mt-1 w-full"
            />
          </label>

          {/* Internal Solution */}
          <label className="block mb-2">
            Internal Solution:
            <input
              type="text"
              name="internal_solution"
              value={form.internal_solution}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 mt-1 w-full"
            />
          </label>

          {/* Valid */}
          <label className="block mb-2">
            Valid:
            <button
              type="button"
              onClick={toggleValid}
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              {form.valid === Valid.S ? "Valid" : "Invalid"}
            </button>
          </label>

          {/* Status */}
          <label className="block mb-2">
            Status:
            <input
              type="text"
              name="status"
              value={form.status}
              readOnly
              disabled
              className="border border-gray-300 rounded-md p-2 mt-1 w-full"
            />
          </label>

          <button
            type="submit"
            className="mt-4 w-full bg-green-500 text-white p-2 rounded-md"
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateReclaimComponent;
