"use client";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { Roles, useCreateUserMutation } from "@/redux/services/usersApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

const CreateUserComponent = ({ closeModal }: { closeModal: () => void }) => {
  const { t } = useTranslation();
  const { data: branchData, isLoading: isLoadingBranch } =
    useGetBranchesQuery(null);
  const [createUser, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateUserMutation();
  const { data: sellersData } = useGetSellersQuery(null);

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    role: Roles.ADMINISTRADOR,
    branch: "",
    seller_id: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm((prevForm) => ({
      ...prevForm,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setPasswordError(t("createUser.passwordMismatch"));
      return;
    }
    setPasswordError(null);

    try {
      await createUser(form).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("createUser.errorCreatingUser"), err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t("createUser.title")}</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
            aria-label={t("createUser.close")}
          >
            <IoMdClose />
          </button>
        </div>

        <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
          {/* Username Field */}
          <label className="flex flex-col">
            {t("createUser.username")}:
            <input
              name="username"
              value={form.username}
              placeholder={t("createUser.usernamePlaceholder")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring focus:ring-green-500"
              required
            />
          </label>

          {/* Email Field */}
          <label className="flex flex-col">
            {t("createUser.email")}:
            <input
              name="email"
              type="email"
              value={form.email}
              placeholder={t("createUser.emailPlaceholder")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring focus:ring-green-500"
              required
            />
          </label>

          {/* Password Field */}
          <label className="flex flex-col">
            {t("createUser.password")}:
            <input
              name="password"
              type="password"
              value={form.password}
              placeholder={t("createUser.passwordPlaceholder")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring focus:ring-green-500"
              required
            />
          </label>

          {/* Confirm Password Field */}
          <label className="flex flex-col">
            {t("createUser.confirmPassword")}:
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              placeholder={t("createUser.confirmPasswordPlaceholder")}
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
            {t("createUser.role")}:
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring focus:ring-green-500"
              required
            >
              <option value="">{t("createUser.selectRole")}</option>
              {Object.values(Roles).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          {/* Branch Field */}
          <label className="flex flex-col">
            {t("createUser.branch")}:
            <select
              name="branch"
              value={form.branch}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring focus:ring-green-500"
            >
              <option value="">{t("createUser.selectBranch")}</option>
              {!isLoadingBranch &&
                branchData?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
            </select>
          </label>

          {form.role === "VENDEDOR" && (
            <label className="flex flex-col">
              {t("createUser.sellerId")}:
              <select
                name="seller_id"
                value={form.seller_id}
                onChange={handleChange}
                className="border border-gray-300 rounded p-2"
              >
                <option value="">{t("createUser.sellerPlaceholder")}</option>
                {sellersData?.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Buttons */}
          <div className="col-span-2 flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 text-white rounded-md p-2 text-sm hover:bg-gray-500"
            >
              {t("createUser.cancel")}
            </button>
            <button
              type="submit"
              className={`bg-green-500 text-white rounded-md p-2 text-sm hover:bg-green-600 transition-all ${
                isLoadingCreate ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoadingCreate}
            >
              {isLoadingCreate
                ? t("createUser.creating")
                : t("createUser.create")}
            </button>
          </div>

          {/* Success or Error Messages */}
          {isSuccess && (
            <p className="text-green-500 col-span-2 text-sm">
              {t("createUser.success")}
            </p>
          )}
          {isError && (
            <p className="text-red-500 col-span-2 text-sm">
              {t("createUser.error")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateUserComponent;
