import { useUpdateCustomerMutation } from '@/redux/services/customersApi';
import React, { useState, useEffect } from 'react';

type DeleteArticleProps = {
  articleId: string;
  closeModal: () => void;
  data: any
};

const DeleteArticleComponent: React.FC<DeleteArticleProps> = ({ articleId, closeModal, data }) => {
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
      <h2 className="text-lg mb-4">Confirm Delete</h2>
      <p>Are you sure you want to delete this Article from Favourites?</p>
      <p className="mt-2 text-sm text-gray-600">Article ID: {decodedArticleId}</p>
      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md p-2 text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={`rounded-md p-2 text-white ${isUpdating ? 'bg-gray-500' : 'bg-red-600'}`}
          disabled={isUpdating}
        >
          {isUpdating ? 'Deleting...' : 'Delete'}
        </button>
      </div>
      {isSuccess && <p className="text-green-500 mt-2">Article deleted successfully!</p>}
      {isError && <p className="text-red-500 mt-2">Error deleting Article</p>}
    </div>
  );
};

export default DeleteArticleComponent;