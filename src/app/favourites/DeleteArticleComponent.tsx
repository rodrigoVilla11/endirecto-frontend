"use client";
import { useUpdateCustomerMutation } from '@/redux/services/customersApi';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type DeleteArticleProps = {
  articleId: string;
  closeModal: () => void;
  data: any;
};

const DeleteArticleComponent: React.FC<DeleteArticleProps> = ({ articleId, closeModal, data }) => {
  const { t } = useTranslation();
  const [updateCustomer, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateCustomerMutation();
  const [decodedArticleId, setDecodedArticleId] = useState('');

  useEffect(() => {
    setDecodedArticleId(decodeURIComponent(articleId));
  }, [articleId]);

  const handleDelete = async () => {
    try {
      const updatedFavourites = data.favourites.filter((id: string) => id !== decodedArticleId);
      const result = await updateCustomer({ 
        id: data.id, 
        favourites: updatedFavourites 
      }).unwrap();

      if (result) {
        closeModal();
      } else {
        throw new Error('Failed to update favourites');
      }
    } catch (err) {
      console.error('Error deleting Article:', err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg mb-4">{t("deleteArticle.confirmDelete")}</h2>
      <p>{t("deleteArticle.confirmPrompt")}</p>
      <p className="mt-2 text-sm text-gray-600">
        {t("deleteArticle.articleId", { id: decodedArticleId })}
      </p>
      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md p-2 text-white"
        >
          {t("deleteArticle.cancel")}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={`rounded-md p-2 text-white ${isUpdating ? 'bg-gray-500' : 'bg-red-600'}`}
          disabled={isUpdating}
        >
          {isUpdating ? t("deleteArticle.deleting") : t("deleteArticle.delete")}
        </button>
      </div>
      {isSuccess && <p className="text-green-500 mt-2">{t("deleteArticle.success")}</p>}
      {isError && <p className="text-red-500 mt-2">{t("deleteArticle.error")}</p>}
    </div>
  );
};

export default DeleteArticleComponent;
