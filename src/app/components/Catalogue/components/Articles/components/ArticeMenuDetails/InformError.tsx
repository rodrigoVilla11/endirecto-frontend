"use client";
import React, { useMemo, useState } from "react";
import { useClient } from "@/app/context/ClientContext";
import {
  Status,
  useCreateReclaimMutation,
  Valid,
} from "@/redux/services/reclaimsApi";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useGetReclaimsTypesQuery } from "@/redux/services/reclaimsTypes";

type InformErrorProps = {
  articleId: string;
  closeModal: () => void;
};

const InformError = ({ articleId, closeModal }: InformErrorProps) => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const [createReclaim, { isLoading, isSuccess, isError }] =
    useCreateReclaimMutation();
  const [description, setDescription] = useState("");
  const [selectedReclaimTypeId, setSelectedReclaimTypeId] = useState("");

  const { data: customer } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

  // Traemos todos los tipos de reclamo
  const { data: reclaimTypes, isLoading: isLoadingTypes } =
    useGetReclaimsTypesQuery();

  // Filtramos solo los de categoría "DATOS DEL ARTICULO"
  const articleReclaimTypes = useMemo(
    () =>
      (reclaimTypes || []).filter(
        (rt) =>
          rt.categoria?.toUpperCase() === "DATOS DE ARTICULO" &&
          !rt.deleted_at
      ),
    [reclaimTypes]
  );

  const handleSubmit = async () => {
    try {
      if (!selectedClientId) {
        console.error("No hay cliente seleccionado");
        return;
      }

      if (!customer?.branch_id) {
        console.error("El cliente no tiene branch_id definido");
        return;
      }

      if (!selectedReclaimTypeId) {
        console.error("No se seleccionó tipo de reclamo");
        return;
      }

      if (!description.trim()) {
        console.error("Descripción vacía");
        return;
      }

      const now = new Date();

      const payload = {
        reclaims_type_id: selectedReclaimTypeId,
        branch_id: customer.branch_id,
        customer_id: selectedClientId,
        article_id: articleId,
        valid: Valid.S,
        date: format(now, "dd/MM/yyyy HH:mm"),
        status: Status.PENDING,
        cause: "",
        description: description.trim(),
      };

      await createReclaim(payload).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error creating reclaim:", err);
    }
  };

  return (
    <div className="p-6 w-128 bg-white rounded-2xl">
      <h2 className="text-xl font-semibold mb-4">
        {t("informErrorTitle") /* ej: "Informar error del artículo" */}
      </h2>

      {/* Info del artículo */}
      <div className="mb-4">
        <p className="font-bold text-gray-800">{articleId}</p>
        {/* TODO: reemplazar por nombre real del artículo si lo tenés */}
        <p className="text-gray-600">ELF MOTO 4 CRUISE 20W50 X 1L</p>
      </div>

      {/* Select de tipo de reclamo */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          { "Tipo de reclamo"}
        </label>
        <select
          className="w-full border border-gray-300 rounded-md p-2 text-sm"
          value={selectedReclaimTypeId}
          onChange={(e) => setSelectedReclaimTypeId(e.target.value)}
          disabled={isLoadingTypes}
        >
          <option value="">
            {isLoadingTypes
              ?  "Cargando..."
              :  "Seleccioná un tipo de reclamo"}
          </option>
          {articleReclaimTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.tipo || rt.categoria}
            </option>
          ))}
        </select>
      </div>

      {/* Descripción */}
      <textarea
        className="w-full p-3 border border-gray-300 rounded-md"
        placeholder={t("describeErrorPlaceholder")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />

      {/* Botones */}
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
            isLoading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLoading ? t("sending") : t("send")}
        </button>
      </div>

      {isSuccess && (
        <p className="text-green-500 mt-4">
          {t("successMessage") || "Se envió el reclamo correctamente."}
        </p>
      )}
      {isError && (
        <p className="text-red-500 mt-4">
          {t("errorMessage") || "Ocurrió un error al enviar el reclamo."}
        </p>
      )}
    </div>
  );
};

export default InformError;
