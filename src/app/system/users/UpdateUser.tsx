import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import {
  Roles,
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "@/redux/services/usersApi";
import React, { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";

type UpdateUserComponentProps = {
  userId: string;
  closeModal: () => void;
};

const UpdateUserComponent = ({
  userId,
  closeModal,
}: UpdateUserComponentProps) => {
  const {
    data: user,
    error,
    isLoading,
  } = useGetUserByIdQuery({
    id: userId,
  });

  const [updateUser, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateUserMutation();

  const { data: branchData, isLoading: isLoadingBranch } =
    useGetBranchesQuery(null);

  const [form, setForm] = useState({
    _id: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    role: Roles.ADMINISTRADOR,
    branch: "",
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        _id: user._id ?? "",
        username: user.username ?? "",
        password: "",
        confirmPassword: "",
        email: user.email ?? "",
        role: user.role ?? "",
        branch: user.branch ?? "",
      });
    }
  }, [user]);

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
    if (form.password !== form.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError(null); // Si no hay error, limpia el mensaje

    try {
      await updateUser(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the user:", err);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching the user.</p>;

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">Update User</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleUpdate}>
        <label className="flex flex-col">
          ID:
          <input
            name="_id"
            value={form._id}
            placeholder="ID"
            readOnly
            className="border border-black rounded-md p-2 bg-gray-200"
          />
        </label>

        <label className="flex flex-col">
          Username:
          <input
            name="username"
            value={form.username}
            placeholder="Username"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Email:
          <input
            name="email"
            value={form.email}
            placeholder="Email"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Password:
          <input
            name="password"
            type="password"
            value={form.password}
            placeholder="Password"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Confirm Password:
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            placeholder="Confirm Password"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        {passwordError && <p className="text-red-500">{passwordError}</p>}

        <label className="flex flex-col">
          Role:
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">Select role</option>
            <option value={Roles.ADMINISTRADOR}>Administrador</option>
            <option value={Roles.OPERADOR}>Operador</option>
            <option value={Roles.MARKETING}>Marketing</option>
            <option value={Roles.VENDEDOR}>Vendedor</option>
          </select>
        </label>

        <label className="flex flex-col">
          Branch:
          <select
            name="branch"
            value={form.branch}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          >
            <option value="">Select branch</option>
            {!isLoadingBranch &&
              branchData?.map((branch: { id: string; name: string }) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
          </select>
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
              isUpdating ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
        </div>

        {isSuccess && (
          <p className="text-green-500">User updated successfully!</p>
        )}
        {isError && <p className="text-red-500">Error updating user</p>}
      </form>
    </div>
  );
};

export default UpdateUserComponent;
