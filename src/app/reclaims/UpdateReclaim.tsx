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
} from "@/redux/services/customersApi";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";
import { useGetReclaimsTypesQuery } from "@/redux/services/reclaimsTypes";
import { useGetSellerByIdQuery } from "@/redux/services/sellersApi";
import { format } from "date-fns";

type UpdateReclaimComponentProps = {
  reclaimId: string;
  closeModal: () => void;
};
const UpdateReclaimComponent = ({
  reclaimId,
  closeModal,
}: UpdateReclaimComponentProps) => {
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
    user_solved_id: ""
  });

  const { data: reclaimTypesData, isLoading: isLoadingReclaimTypes } =
    useGetReclaimsTypesQuery(null);
  const { data: branchesData, isLoading: isLoadingBranches } =
    useGetBranchesQuery(null);
  const { data: customerData, isLoading: isLoadingCustomer } =
    useGetCustomerByIdQuery({ id: form.customer_id });
  const { data: articlesData, isLoading: isLoadingArticles } =
    useGetAllArticlesQuery(null);
    const { data: sellerData, isLoading: isLoadingSeller } = useGetSellerByIdQuery(
        { id: customerData?.seller_id || '' }, 
        { skip: !customerData }
      );
      

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
        cause: reclaim.cause ? reclaim.cause : "",
        solution: reclaim.public_solution ? reclaim.public_solution : "",
        internal_solution: reclaim.internal_solution
          ? reclaim.internal_solution
          : "",
        date_solved: format(new Date(Date.now()), "dd/MM/yyyy HH:mm"),
        user_solved_id: "PONER USER QUE ESTE EN LOGIN"
      });
    }
  }, [reclaim]);

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateReclaim(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error al actualizar la RECLAIM:", err);
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

  return (
    <div>
      <h2 className="text-lg mb-4">Update RECLAIM </h2>
      <form className="flex flex-col gap-4" onSubmit={handleUpdate}>
      <div className="flex gap-4">
        <div className="flex flex-col gap-4">
        <label className="flex flex-col">
          Reclaim Type:
          <select
            name="reclaims_type_id"
            value={form.reclaims_type_id}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">Select Reclaim Type</option>
            {!isLoadingReclaimTypes &&
              reclaimTypesData &&
              reclaimTypesData.map(
                (reclaimType: { id: string; name: string }) => (
                  <option key={reclaimType.id} value={reclaimType.id}>
                    {reclaimType.name}
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
            {!isLoadingBranches &&
              branchesData?.map((branch: { id: string; name: string }) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
          </select>
        </label>

        <label className="flex flex-col">
          Customer:
          <input
            type="text"
            name="description"
            value={customerData?.name}
            readOnly
            disabled
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>
        <label className="flex flex-col">
          Seller:
          <input
            type="text"
            name="seller"
            value={sellerData?.name}
            readOnly
            disabled
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>
        </div>
        <div className="flex flex-col gap-4">

        <label className="flex flex-col">
          Date:
          <input
            type="text"
            name="date"
            value={form.date}
            readOnly
            disabled
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>
        <label className="flex flex-col">
          Status:
          <input
            type="text"
            name="status"
            value={form.status}
            readOnly
            disabled
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Cause:
          <input
            type="text"
            name="cause"
            value={form.cause}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Solution:
          <input
            type="text"
            name="solution"
            value={form.solution}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Internal Solution:
          <input
            type="text"
            name="internal_solution"
            value={form.internal_solution}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>
        <label className="flex flex-col">
          Valid:
          <button
            type="button"
            onClick={toggleValid}
            className={`border rounded-md p-2 ${
              form.valid === Valid.S ? "bg-green-500" : "bg-red-500"
            } text-white`}
          >
            {form.valid === Valid.S ? "Valid (S)" : "Not Valid (N)"}
          </button>
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
              isUpdating ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
        </div>
        {isSuccess && (
          <p className="text-green-500">RECLAIM updated successfully!</p>
        )}
        {isError && <p className="text-red-500">Error updating RECLAIM</p>}
      </form>
    </div>
  );
};

export default UpdateReclaimComponent;
