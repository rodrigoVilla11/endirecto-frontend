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
import Select from "react-select";
import { IoMdClose } from "react-icons/io";
import { useAuth } from "../context/AuthContext";

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
    user_solved_id: userData?._id || "",
  });

  const { data: reclaimTypesData } = useGetReclaimsTypesQuery(null);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      console.error("Error updating reclaim:", err);
    }
  };

  const toggleValid = () => {
    setForm((prevForm) => ({
      ...prevForm,
      valid: prevForm.valid === Valid.S ? Valid.N : Valid.S,
    }));
  };

  const reclaimTypeOptions =
    reclaimTypesData?.map((type: { id: string; name: string }) => ({
      value: type.id,
      label: type.name,
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

  const articleOptions =
    articlesData?.map((article: { id: string; name: string }) => ({
      value: article.id,
      label: article.name,
    })) || [];

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading reclaim data.</p>;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Update Reclaim</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>

      <form className="grid grid-cols-2 gap-4" onSubmit={handleUpdate}>
        <div className="flex flex-col gap-2">
          <label>
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

          <label>
            Description:
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm mt-1"
            />
          </label>

          <label>
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

          <label>
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

          <label>
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

        <div className="flex flex-col gap-2">
          <label>
            Date:
            <input
              type="text"
              name="date"
              value={form.date}
              readOnly
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
          </label>

          <label>
            Cause:
            <input
              type="text"
              name="cause"
              value={form.cause}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
          </label>

          <label>
            Solution:
            <input
              type="text"
              name="solution"
              value={form.solution}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
          </label>

          <label>
            Internal Solution:
            <input
              type="text"
              name="internal_solution"
              value={form.internal_solution}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
          </label>

          <label>
            Valid:
            <button
              type="button"
              onClick={toggleValid}
              className={`p-2 rounded-md text-sm ${
                form.valid === Valid.S ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
            >
              {form.valid === Valid.S ? "Valid" : "Invalid"}
            </button>
          </label>
        </div>

        <div className="col-span-2 flex justify-end gap-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 text-white rounded-md p-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-500 text-white rounded-md p-2 text-sm"
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
