import { useDeleteCrmPrenoteMutation } from '@/redux/services/crmPrenotes';
import React from 'react';

type DeleteCrmPrenoteProps = {
  crmPrenoteId: string;
  closeModal: () => void;
};

const DeleteCrmPrenote = ({ crmPrenoteId, closeModal }: DeleteCrmPrenoteProps) => {
  const [deleteCrmPrenote, { isLoading, isSuccess, isError }] = useDeleteCrmPrenoteMutation();

  const handleDelete = async () => {
    try {
      await deleteCrmPrenote({id: crmPrenoteId}).unwrap();
      closeModal();
    } catch (err) {
      console.error('Error deleting CRM Prenote:', err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg mb-4">Confirm Delete</h2>
      <p>Are you sure you want to delete this CRM Prenote?</p>
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
        {isSuccess && <p className="text-green-500">CRM Prenote deleted successfully!</p>}
        {isError && <p className="text-red-500">Error deleting CRM Prenote</p>}
      </div>
    </div>
  );
};

export default DeleteCrmPrenote;
