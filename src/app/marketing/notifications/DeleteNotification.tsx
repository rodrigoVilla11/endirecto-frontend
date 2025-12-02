"use client";
import React from "react";
import { useDeleteNotificationMutation } from "@/redux/services/notificationsApi";
import { useTranslation } from "react-i18next";

type DeleteNotificationsProps = {
  notificationId: string;
  closeModal: () => void;
};

const DeleteNotificationComponent: React.FC<DeleteNotificationsProps> = ({
  notificationId,
  closeModal,
}) => {
  const { t } = useTranslation();
  const [deleteNotification, { isLoading, isSuccess, isError }] =
    useDeleteNotificationMutation();

  const handleDelete = async () => {
    try {
      await deleteNotification(notificationId).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("deleteNotification.errorLog"), err);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl">
      <h2 className="text-lg mb-4">{t("deleteNotification.confirmDelete")}</h2>
      <p>{t("deleteNotification.confirmPrompt")}</p>
      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md p-2 text-white"
        >
          {t("deleteNotification.cancel")}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isLoading}
          className={`rounded-md p-2 text-white ${
            isLoading ? "bg-gray-500" : "bg-red-600"
          }`}
        >
          {isLoading
            ? t("deleteNotification.deleting")
            : t("deleteNotification.delete")}
        </button>
      </div>
      {isSuccess && (
        <p className="text-green-500 mt-2">
          {t("deleteNotification.success")}
        </p>
      )}
      {isError && (
        <p className="text-red-500 mt-2">
          {t("deleteNotification.error")}
        </p>
      )}
    </div>
  );
};

export default DeleteNotificationComponent;
