import { useDeleteUserMutation } from "@/redux/services/usersApi";
import React from "react";
import { useTranslation } from "react-i18next";

type DeleteUserProps = {
  userId: string;
  closeModal: () => void;
};

const DeleteUserComponent = ({ userId, closeModal }: DeleteUserProps) => {
  const { t } = useTranslation();
  const [deleteUser, { isLoading, isSuccess, isError }] =
    useDeleteUserMutation();

  const handleDelete = async () => {
    try {
      await deleteUser(userId).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("deleteUser.errorDeletingUser"), err);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl">
      <h2 className="text-lg mb-4">{t("deleteUser.title")}</h2>
      <p>{t("deleteUser.confirmMessage")}</p>
      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md p-2 text-white"
        >
          {t("deleteUser.cancel")}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={`rounded-md p-2 text-white ${
            isLoading ? "bg-gray-500" : "bg-red-600"
          }`}
          disabled={isLoading}
        >
          {isLoading ? t("deleteUser.deleting") : t("deleteUser.delete")}
        </button>
        {isSuccess && (
          <p className="text-green-500">{t("deleteUser.success")}</p>
        )}
        {isError && (
          <p className="text-red-500">{t("deleteUser.error")}</p>
        )}
      </div>
    </div>
  );
};

export default DeleteUserComponent;
