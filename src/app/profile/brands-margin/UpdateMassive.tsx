import React, { useState } from "react";
import { useUpdateMassiveCustomersBrandsMutation } from "@/redux/services/customersBrandsApi";

type UpdateMassiveProps = {
    customer_id: string;
  closeModal: () => void;
};

const UpdateMassive = ({ customer_id, closeModal }: UpdateMassiveProps) => {
  const [updateMassive, { isLoading, isSuccess, isError }] =
    useUpdateMassiveCustomersBrandsMutation();
  const [margin, setMargin] = useState<number | "">("");

  const handleSubmit = async () => {
    if (margin === "" || margin < 0) {
      alert("Please enter a valid margin greater or equal to 0.");
      return;
    }

    try {
      const payload = {
        customer_id: customer_id,
        margin,
      };

      await updateMassive(payload).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating margin:", err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg mb-4 font-semibold">Massive Update</h2>
      <p>Enter a new margin for the Massive Update by Brand:</p>
      <input
        type="number"
        value={margin}
        onChange={(e) => setMargin(Number(e.target.value) || "")}
        placeholder="New margin"
        className="w-full mt-4 p-2 border border-gray-300 rounded-md"
        min={0}
      />
      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md px-4 py-2 text-white hover:bg-gray-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={`rounded-md px-4 py-2 text-white ${
            isLoading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Update Margin"}
        </button>
      </div>
      {isSuccess && <p className="text-green-500 mt-4">Margin updated successfully!</p>}
      {isError && <p className="text-red-500 mt-4">Error updating margin. Please try again.</p>}
    </div>
  );
};

export default UpdateMassive;
