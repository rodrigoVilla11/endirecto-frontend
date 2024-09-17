import { useCreateCollectionMutation } from "@/redux/services/collectionsApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetUsersQuery } from "@/redux/services/usersApi";
import React, { useState } from "react";
import { format } from "date-fns";
import { IoMdClose } from "react-icons/io";
import { stringify } from "querystring";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";

enum status {
  "PENDING" = "PENDING",
  SENDED = "SENDED",
  SUMMARIZED = "SUMMARIZED",
  CHARGED = "CHARGED",
  CANCELED = "CANCELED",
}

const CreatePaymentComponent = ({ closeModal }: { closeModal: () => void }) => {
  const currentDate = format(new Date(), "yyyy-MM-dd");

  const [form, setForm] = useState({
    number: "",
    status: status.PENDING,
    date: currentDate,
    amount: 0,
    netamount: 0,
    branch_id: "",
    files: "",
    customer_id: "",
    seller_id: "",
    user_id: "",
    notes: "",
  });

  const { data: customersData, isLoading: isLoadingCustomers } =
    useGetCustomersQuery(null);
  const { data: sellerData, isLoading: isLoadingSellers } =
    useGetSellersQuery(null);
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(null);
  const { data: branchsData, isLoading: isLoadingBranchs } = useGetBranchesQuery(null);


  const [createCollection, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateCollectionMutation();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCollection(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error al crear la colección:", err);
    }
  };

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">New Payment</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label>
          Número:
          <input
            type="text"
            name="number"
            value={form.number}
            onChange={handleChange}
          />
        </label>

        <label>
          Estado:
          <select name="status" value={form.status} onChange={handleChange}>
            {Object.values(status).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </label>

        <label>
          Fecha:
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />
        </label>
        <label>
          Files:
          <input
            type="text"
            name="files"
            value={form.files}
            onChange={handleChange}
          />
        </label>
        <label>
          Amount:
          <input
            type="text"
            name="amount"
            value={form.amount}
            onChange={handleChange}
          />
        </label>
        <label>
          Net Amount:
          <input
            type="text"
            name="netamount"
            value={form.netamount}
            onChange={handleChange}
          />
        </label>

        <label className="flex flex-col">
          Customer:
          <select
            name="customer_id"
            value={form.customer_id}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">Select customer</option>
            {!isLoadingCustomers &&
              customersData?.map((customer: { id: string; name: string }) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
          </select>
        </label>
        <label className="flex flex-col">
          Seller:
          <select
            name="seller_id"
            value={form.seller_id}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">Select seller</option>
            {!isLoadingSellers &&
              sellerData?.map((seller: { id: string; name: string }) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
          </select>
        </label>
        <label className="flex flex-col">
          User:
          <select
            name="user_id"
            value={form.user_id}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">Select user</option>
            {!isLoadingUsers &&
              usersData?.map((user: { _id: string; username: string }) => (
                <option key={user._id} value={user._id}>
                  {user.username}
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
            <option value="">Select branch</option>
            {!isLoadingBranchs &&
              branchsData?.map((branch: { id: string; name: string }) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Notes:
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
          />
        </label>
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
          <p className="text-green-500">Payment created successfully!</p>
        )}
        {isError && <p className="text-red-500">Error creating Payment</p>}
      </form>
    </div>
  );
};

export default CreatePaymentComponent;
