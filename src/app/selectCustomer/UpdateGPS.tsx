import React, { useState } from 'react';
import { useUpdateCustomerMutation } from '@/redux/services/customersApi';

type UpdateGPSProps = {
  customerId: string;
  closeModal: () => void;
};

const UpdateGPS = ({ customerId, closeModal }: UpdateGPSProps) => {
  const [updateCustomer, { isLoading, isSuccess, isError }] = useUpdateCustomerMutation();
  const [gps, setGPS] = useState('');

  const handleSubmit = async () => {
    try {
      const payload = {
        id: customerId || '',
        gps: gps,
      };

      await updateCustomer(payload).unwrap();
      closeModal();
    } catch (err) {
      console.error('Error updating GPS:', err);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      console.error("La geolocalización no es soportada por este navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Formateamos el string en el formato "lat, lon"
        const gpsStr = `${latitude}, ${longitude}`;
        setGPS(gpsStr);
      },
      (error) => {
        console.error("Error obteniendo la ubicación:", error);
      }
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-lg mb-4 font-semibold">Update GPS</h2>
      <p>MAP FOR GPS:</p>
      <input
        type="text"
        value={gps}
        onChange={(e) => setGPS(e.target.value)}
        placeholder="New location (lat, lon)"
        className="w-full mt-4 p-2 border border-gray-300 rounded-md"
      />
      <button
        type="button"
        onClick={handleGetLocation}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        Obtener ubicación actual
      </button>
      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md px-4 py-2 text-white hover:bg-gray-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={`rounded-md px-4 py-2 text-white ${
            isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update GPS'}
        </button>
      </div>
      {isSuccess && <p className="text-green-500 mt-4">GPS updated successfully!</p>}
      {isError && <p className="text-red-500 mt-4">Error updating GPS. Please try again.</p>}
    </div>
  );
};

export default UpdateGPS;
