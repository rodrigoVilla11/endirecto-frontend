import React, { useState } from 'react';
import { useUpdateCustomerMutation } from '@/redux/services/customersApi';
import { useTranslation } from 'react-i18next';

type ResetPasswordProps = {
  customerId: string;
  closeModal: () => void;
};

const ResetPassword = ({ customerId, closeModal }: ResetPasswordProps) => {
  const { t } = useTranslation();
  const [updateCustomer, { isLoading, isSuccess, isError }] = useUpdateCustomerMutation();
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    try {
      const payload = {
        id: customerId || '',
        password: password,
      };

      await updateCustomer(payload).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("resetPassword.errorUpdating"), err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg mb-4 font-semibold">
        {t("resetPassword.title")}
      </h2>
      <p>{t("resetPassword.description")}</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("resetPassword.placeholder")}
        className="w-full mt-4 p-2 border border-gray-300 rounded-md"
      />
      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md px-4 py-2 text-white hover:bg-gray-500"
        >
          {t("resetPassword.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={`rounded-md px-4 py-2 text-white ${
            isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isLoading}
        >
          {isLoading ? t("resetPassword.updating") : t("resetPassword.updatePassword")}
        </button>
      </div>
      {isSuccess && <p className="text-green-500 mt-4">{t("resetPassword.success")}</p>}
      {isError && <p className="text-red-500 mt-4">{t("resetPassword.error")}</p>}
    </div>
  );
};

export default ResetPassword;
