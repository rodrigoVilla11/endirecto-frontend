import { useCreateCollectionMutation } from "@/redux/services/collectionsApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetUsersQuery } from "@/redux/services/usersApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import React, { useState } from "react";
import { format } from "date-fns";
import { IoMdClose } from "react-icons/io";
import { useClient } from "@/app/context/ClientContext";
import { useAuth } from "@/app/context/AuthContext";

enum status {
  PENDING = "PENDING",
  SENDED = "SENDED",
  SUMMARIZED = "SUMMARIZED",
  CHARGED = "CHARGED",
  CANCELED = "CANCELED",
}

const CreatePaymentComponent = ({ closeModal }: { closeModal: () => void }) => {
  const currentDate = format(new Date(), "yyyy-MM-dd");

  const { selectedClientId } = useClient();
  const { userData } = useAuth();

  const [form, setForm] = useState({
    number: "",
    status: status.PENDING,
    date: currentDate,
    amount: 0,
    netamount: 0,
    branch_id: "",
    files: "",
    customer_id: selectedClientId ? selectedClientId : "",
    seller_id: "",
    user_id: userData ? userData?._id : "",
    notes: "",
  });

  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery(null);
  const { data: sellerData, isLoading: isLoadingSellers } = useGetSellersQuery(null);
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(null);
  const { data: branchsData, isLoading: isLoadingBranchs } = useGetBranchesQuery(null);

  const [createCollection, { isLoading: isLoadingCreate, isSuccess, isError }] = useCreateCollectionMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      console.error("Error al crear el pago:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-scroll scrollbar-hide">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New Payment</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
            aria-label="Close"
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Details */}
          <div className="border border-gray-200 rounded-md p-3">
            <h3 className="text-sm font-medium mb-3">Payment Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium">Number</label>
                <input
                  type="text"
                  name="number"
                  value={form.number}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-1 text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-1 text-sm w-full"
                >
                  {Object.values(status).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-1 text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium">Files</label>
                <input
                  type="text"
                  name="files"
                  value={form.files}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-1 text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-1 text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium">Net Amount</label>
                <input
                  type="number"
                  name="netamount"
                  value={form.netamount}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-1 text-sm w-full"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="border border-gray-200 rounded-md p-3">
            <h3 className="text-sm font-medium mb-3">Additional Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium">Customer</label>
                <select
                  name="customer_id"
                  value={form.customer_id}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-1 text-sm w-full"
                  disabled={!!selectedClientId}
                >
                  <option value="">Select customer</option>
                  {!isLoadingCustomers &&
                    customersData?.map((customer: { id: string; name: string }) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium">Seller</label>
                <select
                  name="seller_id"
                  value={form.seller_id}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-1 text-sm w-full"
                >
                  <option value="">Select seller</option>
                  {!isLoadingSellers &&
                    sellerData?.map((seller: { id: string; name: string }) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium">User</label>
                <select
                  name="user_id"
                  value={form.user_id}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-1 text-sm w-full"
                  disabled
                >
                  <option value="">Select user</option>
                  {!isLoadingUsers &&
                    usersData?.map((user: { _id: string; username: string }) => (
                      <option key={user._id} value={user._id}>
                        {user.username}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium">Branch</label>
                <select
                  name="branch_id"
                  value={form.branch_id}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-1 text-sm w-full"
                >
                  <option value="">Select branch</option>
                  {!isLoadingBranchs &&
                    branchsData?.map((branch: { id: string; name: string }) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-1 text-sm w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 text-white rounded-md px-3 py-1 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`rounded-md px-3 py-1 text-sm text-white ${
                isLoadingCreate ? "bg-gray-500" : "bg-blue-600"
              }`}
              disabled={isLoadingCreate}
            >
              {isLoadingCreate ? "Saving..." : "Save"}
            </button>
          </div>

          {isSuccess && <p className="text-green-500 text-sm mt-2">Payment created successfully!</p>}
          {isError && <p className="text-red-500 text-sm mt-2">Error creating payment</p>}
        </form>
      </div>
    </div>
  );
};

export default CreatePaymentComponent;
