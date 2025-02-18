import React from 'react';
import { useDeleteReclaimMutation } from '@/redux/services/reclaimsApi';
import { useTranslation } from "react-i18next";

type DeleteReclaimProps = {
  reclaimId: string;
  closeModal: () => void;
};

const DeleteReclaim = ({ reclaimId, closeModal }: DeleteReclaimProps) => {
  const { t } = useTranslation();
  const [deleteReclaim, { isLoading, isSuccess, isError }] = useDeleteReclaimMutation();

  const handleDelete = async () => {
    try {
      await deleteReclaim(reclaimId).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("deleteReclaim.errorDeleting"), err);
    }
  };

  return (
      <div className="p-4">
        <h2 className="text-lg mb-4">{t("deleteReclaim.title")}</h2>
        <p>{t("deleteReclaim.confirmMessage")}</p>
        <div className="flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 rounded-md p-2 text-white"
          >
            {t("deleteReclaim.cancel")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={`rounded-md p-2 text-white ${isLoading ? 'bg-gray-500' : 'bg-red-600'}`}
            disabled={isLoading}
          >
            {isLoading ? t("deleteReclaim.deleting") : t("deleteReclaim.delete")}
          </button>
          {isSuccess && <p className="text-green-500">{t("deleteReclaim.success")}</p>}
          {isError && <p className="text-red-500">{t("deleteReclaim.error")}</p>}
        </div>
      </div>
  );
};

export default DeleteReclaim;
