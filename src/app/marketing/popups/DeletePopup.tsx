"use client";
import { useDeleteMarketingMutation } from "@/redux/services/marketingApi";
import React from "react";
import { useTranslation } from "react-i18next";

type DeletePopupProps = {
  marketingId: string;
  closeModal: () => void;
};

const DeletePopupComponent = ({ marketingId, closeModal }: DeletePopupProps) => {
  const { t } = useTranslation();
  const [deleteMarketing, { isLoading, isSuccess, isError }] = useDeleteMarketingMutation();

  const handleDelete = async () => {
    try {
      await deleteMarketing(marketingId).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("deletePopup.errorLog"), err);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl">
      <h2 className="text-lg mb-4">{t("deletePopup.confirmDelete")}</h2>
      <p>{t("deletePopup.confirmPrompt")}</p>
      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md p-2 text-white"
        >
          {t("deletePopup.cancel")}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={`rounded-md p-2 text-white ${
            isLoading ? "bg-gray-500" : "bg-red-600"
          }`}
          disabled={isLoading}
        >
          {isLoading ? t("deletePopup.deleting") : t("deletePopup.delete")}
        </button>
      </div>
      {isSuccess && (
        <p className="text-green-500 mt-2">{t("deletePopup.success")}</p>
      )}
      {isError && (
        <p className="text-red-500 mt-2">{t("deletePopup.error")}</p>
      )}
    </div>
  );
};

export default DeletePopupComponent;
