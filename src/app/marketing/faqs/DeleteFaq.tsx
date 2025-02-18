"use client";
import React from "react";
import { useDeleteFaqMutation } from "@/redux/services/faqsApi";
import { useTranslation } from "react-i18next";

type DeleteFaqProps = {
  faqId: string;
  closeModal: () => void;
};

const DeleteFaq = ({ faqId, closeModal }: DeleteFaqProps) => {
  const { t } = useTranslation();
  const [deleteFaq, { isLoading, isSuccess, isError }] = useDeleteFaqMutation();

  const handleDelete = async () => {
    try {
      await deleteFaq(faqId).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("deleteFaq.errorLog"), err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg mb-4">{t("deleteFaq.confirmDelete")}</h2>
      <p>{t("deleteFaq.confirmPrompt")}</p>
      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md p-2 text-white"
        >
          {t("deleteFaq.cancel")}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={`rounded-md p-2 text-white ${
            isLoading ? "bg-gray-500" : "bg-red-600"
          }`}
          disabled={isLoading}
        >
          {isLoading ? t("deleteFaq.deleting") : t("deleteFaq.delete")}
        </button>
        {isSuccess && (
          <p className="text-green-500 mt-2">{t("deleteFaq.success")}</p>
        )}
        {isError && (
          <p className="text-red-500 mt-2">{t("deleteFaq.error")}</p>
        )}
      </div>
    </div>
  );
};

export default DeleteFaq;
