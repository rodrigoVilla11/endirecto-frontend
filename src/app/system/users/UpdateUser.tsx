"use client";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import {
  Roles,
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "@/redux/services/usersApi";
import React, { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

type UpdateUserComponentProps = {
  userId: string;
  closeModal: () => void;
};

const UpdateUserComponent = ({
  userId,
  closeModal,
}: UpdateUserComponentProps) => {
  const { t } = useTranslation();
  const { data: user, error, isLoading } = useGetUserByIdQuery({ id: userId });
  const { data: sellersData } = useGetSellersQuery(null);
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
    seller_id: "",
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
        seller_id: user.seller_id ?? "",
      });
    }
  }, [user]);

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setPasswordError(t("updateUser.passwordMismatch"));
      return;
    }
    setPasswordError(null);

    try {
      await updateUser(form).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("updateUser.errorUpdatingUser"), err);
    }
  };

  if (isLoading) return <p>{t("updateUser.loading")}</p>;
  if (error) return <p>{t("updateUser.errorFetchingUser")}</p>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t("updateUser.title")}</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
            aria-label={t("updateUser.close")}
          >
            <IoMdClose />
          </button>
        </div>

        <form className="grid grid-cols-2 gap-4" onSubmit={handleUpdate}>
          {/* Username Field */}
          <label className="flex flex-col">
            {t("updateUser.username")}:
            <input
              name="username"
              value={form.username}
              placeholder={t("updateUser.usernamePlaceholder")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2"
            />
          </label>

          {/* Email Field */}
          <label className="flex flex-col">
            {t("updateUser.email")}:
            <input
              name="email"
              value={form.email}
              placeholder={t("updateUser.emailPlaceholder")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2"
            />
          </label>

          {/* Password Field */}
          <label className="flex flex-col">
            {t("updateUser.password")}:
            <input
              name="password"
              type="password"
              value={form.password}
              placeholder={t("updateUser.passwordPlaceholder")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2"
            />
          </label>

          {/* Confirm Password Field */}
          <label className="flex flex-col">
            {t("updateUser.confirmPassword")}:
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              placeholder={t("updateUser.confirmPasswordPlaceholder")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2"
            />
          </label>

          {/* Password Error Message */}
          {passwordError && (
            <p className="text-red-500 col-span-2 text-sm">{passwordError}</p>
          )}

          {/* Role Field */}
          <label className="flex flex-col">
            {t("updateUser.role")}:
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2"
            >
              <option value="">{t("updateUser.selectRole")}</option>
              <option value={Roles.ADMINISTRADOR}>
                {t("updateUser.roleAdmin")}
              </option>
              <option value={Roles.OPERADOR}>
                {t("updateUser.roleOperator")}
              </option>
              <option value={Roles.MARKETING}>
                {t("updateUser.roleMarketing")}
              </option>
              <option value={Roles.VENDEDOR}>
                {t("updateUser.roleSeller")}
              </option>
            </select>
          </label>

          {/* Branch Field */}
          <label className="flex flex-col">
            {t("updateUser.branch")}:
            <select
              name="branch"
              value={form.branch}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2"
            >
              <option value="">{t("updateUser.selectBranch")}</option>
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
              {t("updateUser.sellerId")}:
              <select
                name="seller_id"
                value={form.seller_id}
                onChange={handleChange}
                className="border border-gray-300 rounded p-2"
              >
                <option value="">{t("updateUser.sellerPlaceholder")}</option>
                {sellersData?.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Buttons */}
          <div className="col-span-2 flex justify-end gap-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 text-white rounded-md p-2"
            >
              {t("updateUser.cancel")}
            </button>
            <button
              type="submit"
              className={`bg-green-500 text-white rounded-md p-2 ${
                isUpdating ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isUpdating}
            >
              {isUpdating ? t("updateUser.updating") : t("updateUser.update")}
            </button>
          </div>

          {isSuccess && (
            <p className="text-green-500 col-span-2 text-sm">
              {t("updateUser.success")}
            </p>
          )}
          {isError && (
            <p className="text-red-500 col-span-2 text-sm">
              {t("updateUser.error")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default UpdateUserComponent;
