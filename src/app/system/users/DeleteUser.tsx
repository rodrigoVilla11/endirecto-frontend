import { useDeleteUserMutation } from "@/redux/services/usersApi";
import React from "react";

type DeleteUserProps = {
  userId: string;
  closeModal: () => void;
};

const DeleteUserComponent = ({ userId, closeModal }: DeleteUserProps) => {
  const [deleteUser, { isLoading, isSuccess, isError }] =
    useDeleteUserMutation();

  const handleDelete = async () => {
    try {
      await deleteUser(userId).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error deleting User:", err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg mb-4">Confirm Delete</h2>
      <p>Are you sure you want to delete this User?</p>
      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md p-2 text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={`rounded-md p-2 text-white ${
            isLoading ? "bg-gray-500" : "bg-red-600"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Deleting..." : "Delete"}
        </button>
        {isSuccess && (
          <p className="text-green-500">User deleted successfully!</p>
        )}
        {isError && <p className="text-red-500">Error deleting User</p>}
      </div>
    </div>
  );
};

export default DeleteUserComponent;
