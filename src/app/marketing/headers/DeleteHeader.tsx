"use client";
import { useDeleteMarketingMutation } from "@/redux/services/marketingApi";
import React from "react";
import { useTranslation } from "react-i18next";

type DeleteHeaderProps = {
  marketingId: string;
  closeModal: () => void;
};

const DeleteHeaderComponent = ({ marketingId, closeModal }: DeleteHeaderProps) => {
  const { t } = useTranslation();
  const [deleteMarketing, { isLoading, isSuccess, isError }] =
    useDeleteMarketingMutation();

  const handleDelete = async () => {
    try {
      await deleteMarketing(marketingId).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("deleteHeader.errorLog"), err);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl">
      <h2 className="text-lg mb-4">{t("deleteHeader.confirmDelete")}</h2>
      <p>{t("deleteHeader.confirmPrompt")}</p>
      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md p-2 text-white"
        >
          {t("deleteHeader.cancel")}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={`rounded-md p-2 text-white ${isLoading ? "bg-gray-500" : "bg-red-600"}`}
          disabled={isLoading}
        >
          {isLoading ? t("deleteHeader.deleting") : t("deleteHeader.delete")}
        </button>
      </div>
      {isSuccess && (
        <p className="text-green-500 mt-2">{t("deleteHeader.success")}</p>
      )}
      {isError && <p className="text-red-500 mt-2">{t("deleteHeader.error")}</p>}
    </div>
  );
};

export default DeleteHeaderComponent;
