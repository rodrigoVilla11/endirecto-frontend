import React from 'react';
import { useDeleteFaqMutation } from '@/redux/services/faqsApi';
import Modal from '@/app/components/components/Modal';

type DeleteFaqProps = {
  faqId: string;
  closeModal: () => void;
};

const DeleteFaq = ({ faqId, closeModal }: DeleteFaqProps) => {
  const [deleteFaq, { isLoading, isSuccess, isError }] = useDeleteFaqMutation();

  const handleDelete = async () => {
    try {
      await deleteFaq(faqId).unwrap();
      closeModal();
    } catch (err) {
      console.error('Error deleting FAQ:', err);
    }
  };

  return (
      <div className="p-4">
        <h2 className="text-lg mb-4">Confirm Delete</h2>
        <p>Are you sure you want to delete this FAQ?</p>
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
            className={`rounded-md p-2 text-white ${isLoading ? 'bg-gray-500' : 'bg-red-600'}`}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
          {isSuccess && <p className="text-green-500">FAQ deleted successfully!</p>}
          {isError && <p className="text-red-500">Error deleting FAQ</p>}
        </div>
      </div>
  );
};

export default DeleteFaq;
