import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { Roles, useCreateUserMutation } from "@/redux/services/usersApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

const CreateUserComponent = ({ closeModal }: { closeModal: () => void }) => {
  const { data: branchData, isLoading: isLoadingBranch } = useGetBranchesQuery(null);
  const [createUser, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateUserMutation();

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    role: Roles.ADMINISTRADOR,
    branch: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
    if (form.password !== form.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError(null);

    try {
      await createUser(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error creating the user:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Create User</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
            aria-label="Close"
          >
            <IoMdClose />
          </button>
        </div>

        <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
          {/* Username Field */}
          <label className="flex flex-col">
            Username:
            <input
              name="username"
              value={form.username}
              placeholder="Username"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring focus:ring-green-500"
              required
            />
          </label>

          {/* Email Field */}
          <label className="flex flex-col">
            Email:
            <input
              name="email"
              type="email"
              value={form.email}
              placeholder="Email"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring focus:ring-green-500"
              required
            />
          </label>

          {/* Password Field */}
          <label className="flex flex-col">
            Password:
            <input
              name="password"
              type="password"
              value={form.password}
              placeholder="Password"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring focus:ring-green-500"
              required
            />
          </label>

          {/* Confirm Password Field */}
          <label className="flex flex-col">
            Confirm Password:
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              placeholder="Confirm Password"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring focus:ring-green-500"
              required
            />
          </label>

          {/* Password Error Message */}
          {passwordError && (
            <p className="text-red-500 col-span-2 text-sm">{passwordError}</p>
          )}

          {/* Role Field */}
          <label className="flex flex-col">
            Role:
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring focus:ring-green-500"
              required
            >
              <option value="">Select role</option>
              {Object.values(Roles).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          {/* Branch Field */}
          <label className="flex flex-col">
            Branch:
            <select
              name="branch"
              value={form.branch}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring focus:ring-green-500"
            >
              <option value="">Select branch</option>
              {!isLoadingBranch &&
                branchData?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
            </select>
          </label>

          {/* Buttons */}
          <div className="col-span-2 flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 text-white rounded-md p-2 text-sm hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`bg-green-500 text-white rounded-md p-2 text-sm hover:bg-green-600 transition-all ${
                isLoadingCreate ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoadingCreate}
            >
              {isLoadingCreate ? "Creating..." : "Create"}
            </button>
          </div>

          {/* Success or Error Messages */}
          {isSuccess && (
            <p className="text-green-500 col-span-2 text-sm">
              User created successfully!
            </p>
          )}
          {isError && (
            <p className="text-red-500 col-span-2 text-sm">Error creating user</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateUserComponent;
