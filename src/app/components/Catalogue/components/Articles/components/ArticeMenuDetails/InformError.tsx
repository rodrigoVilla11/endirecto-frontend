"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { useClient } from "@/app/context/ClientContext";
import { Status, useCreateReclaimMutation, Valid } from "@/redux/services/reclaimsApi";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

type InformErrorProps = {
  articleId: string;
  closeModal: () => void;
};

const InformError = ({ articleId, closeModal }: InformErrorProps) => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const [createReclaim, { isLoading, isSuccess, isError }] = useCreateReclaimMutation();
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    try {
      const payload = {
        reclaims_type_id: "",
        branch_id: "",
        customer_id: selectedClientId || "",
        article_id: articleId,
        valid: Valid.S,
        date: Date.now().toString(),
        status: Status.PENDING,
        cause: "",
        description,
      };

      const formattedData = {
        ...payload,
        date: format(new Date(payload.date), "dd/MM/yyyy HH:mm"),
      };

      await createReclaim(formattedData).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error creating reclaim:", err);
    }
  };

  return (
    <div className="p-6 w-128">
      <h2 className="text-xl font-semibold mb-4">{t("informErrorTitle")}</h2>
      <div className="mb-4">
        <p className="font-bold text-gray-800">{articleId}</p>
        <p className="text-gray-600">ELF MOTO 4 CRUISE 20W50 X 1L</p>
      </div>
      <textarea
        className="w-full p-3 border border-gray-300 rounded-md"
        placeholder={t("describeErrorPlaceholder")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />
      <div className="flex justify-end mt-6 gap-4">
        <button
          type="button"
          onClick={closeModal}
          className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
        >
          {t("close")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white ${
            isLoading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLoading ? t("sending") : t("send")}
        </button>
      </div>
      {isSuccess && <p className="text-green-500 mt-4">{t("successMessage")}</p>}
      {isError && (
        <p className="text-red-500 mt-4">{t("errorMessage")}</p>
      )}
    </div>
  );
};

export default InformError;
