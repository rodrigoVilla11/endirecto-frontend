import { useUpdateCustomerMutation } from '@/redux/services/customersApi';
import React from 'react';

type DeleteArticleProps = {
  articleId: string;
  closeModal: () => void;
  data: any;
};

const DeleteArticleComponent = ({ articleId, closeModal, data }: DeleteArticleProps) => {
  const [updateCustomer, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateCustomerMutation();

  const handleDelete = async () => {
    try {
        console.log(articleId)
      const updatedShoppingCart = data.shopping_cart.filter((id: string) => id !== articleId);
      console.log(updatedShoppingCart)
      await updateCustomer({ id: data.id, shopping_cart: updatedShoppingCart });
      closeModal();
    } catch (err) {
      console.error('Error deleting Article:', err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg mb-4">Confirm Delete</h2>
      <p>Are you sure you want to delete this Article from ShoppingCart?</p>
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
        {isSuccess && <p className="text-green-500">Article deleted successfully!</p>}
        {isError && <p className="text-red-500">Error deleting Article</p>}
      </div>
    </div>
  );
};

export default DeleteArticleComponent;
