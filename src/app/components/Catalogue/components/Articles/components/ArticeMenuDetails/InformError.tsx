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
import {
  Roles,
  useAddNotificationToUsersByRolesMutation,
} from "@/redux/services/usersApi";

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

  const [addNotificationToUsersByRoles] =
    useAddNotificationToUsersByRolesMutation();

  const buildReclaimNotificationText = () => {
    const reclaimType = articleReclaimTypes.find(
      (rt) => String(rt.id) === String(selectedReclaimTypeId)
    );

    const reclamoLabel = reclaimType
      ? `${reclaimType.categoria}${
          reclaimType.tipo ? ` - ${reclaimType.tipo}` : ""
        }`
      : String(selectedReclaimTypeId || "—");

    const customerLabel = customer
      ? `${customer.id} - ${customer.name}`
      : String(selectedClientId || "—");

    return [
      "Nuevo Reclamo",
      "Estado: PENDIENTE",
      `Cliente: ${customerLabel}`,
      `Sucursal: ${customer?.branch_id || "—"}`,
      `Tipo de reclamo: ${reclamoLabel}`,
      `Artículo: ${articleId}`,
      `Descripción: ${description.trim() || "—"}`,
    ].join("\n");
  };

  // Traemos todos los tipos de reclamo
  const { data: reclaimTypes, isLoading: isLoadingTypes } =
    useGetReclaimsTypesQuery();

  // Filtramos solo los de categoría "DATOS DEL ARTICULO"
  const articleReclaimTypes = useMemo(
    () =>
      (reclaimTypes || []).filter(
        (rt) =>
          rt.categoria?.toUpperCase() === "DATOS DE ARTICULO" && !rt.deleted_at
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

      const created = await createReclaim(payload).unwrap();

      // ✅ Notificar a todos los ADMINISTRADOR
      try {
        const nowN = new Date();
        const schedule_from = nowN.toISOString();
        const schedule_to = new Date(
          nowN.getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString();

        await addNotificationToUsersByRoles({
          roles: [Roles.ADMINISTRADOR],
          notification: {
            title: "Nuevo reclamo creado",
            type: "CONTACTO", // ajustá si tu backend usa enum específico
            description: buildReclaimNotificationText(),
            link: "/reclaims",
            schedule_from,
            schedule_to,
            customer_id: selectedClientId, // si tu backend lo soporta
          },
        } as any).unwrap();
      } catch (notifErr) {
        console.error(
          "No se pudo enviar notificación a ADMINISTRADOR:",
          notifErr
        );
      }

      closeModal();
    } catch (err) {
      console.error("Error creating reclaim:", err);
    }
  };

  return (
    <div className="p-6 w-128 bg-[#0B0B0B] rounded-2xl border border-white/10 shadow-2xl">
      <h2 className="text-xl font-extrabold mb-4 text-white">
        {t("informErrorTitle")}
        <span className="text-[#E10600]">.</span>
      </h2>

      {/* Info del artículo */}
      <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="font-extrabold text-white tracking-wide">{articleId}</p>
        {/* TODO: reemplazar por nombre real del artículo si lo tenés */}
        <p className="text-white/70 text-sm mt-1">
          ELF MOTO 4 CRUISE 20W50 X 1L
        </p>
        <div className="mt-3 h-0.5 w-12 bg-[#E10600] opacity-80 rounded-full" />
      </div>

      {/* Select de tipo de reclamo */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-white/80 mb-1">
          {"Tipo de reclamo"}
        </label>

        <select
          className="
          w-full rounded-xl p-3 text-sm
          bg-white/10 text-white
          border border-white/20
          focus:border-[#E10600] focus:outline-none
          disabled:opacity-60 disabled:cursor-not-allowed
        "
          value={selectedReclaimTypeId}
          onChange={(e) => setSelectedReclaimTypeId(e.target.value)}
          disabled={isLoadingTypes}
        >
          <option value="" className="bg-[#0B0B0B]">
            {isLoadingTypes ? "Cargando..." : "Seleccioná un tipo de reclamo"}
          </option>

          {articleReclaimTypes.map((rt) => (
            <option key={rt.id} value={rt.id} className="bg-[#0B0B0B]">
              {rt.tipo || rt.categoria}
            </option>
          ))}
        </select>
      </div>

      {/* Descripción */}
      <textarea
        className="
        w-full p-3 rounded-xl
        bg-white/10 text-white
        border border-white/20
        focus:border-[#E10600] focus:outline-none
        placeholder:text-white/40
      "
        placeholder={t("describeErrorPlaceholder")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />

      {/* Botones */}
      <div className="flex justify-end mt-6 gap-3">
        <button
          type="button"
          onClick={closeModal}
          className="
          px-4 py-2 rounded-xl
          bg-white/10 text-white
          border border-white/20
          hover:bg-white/15
          transition-all
        "
        >
          {t("close")}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`
          px-4 py-2 rounded-xl text-white font-bold
          transition-all shadow-lg
          ${
            isLoading
              ? "bg-white/10 border border-white/10 cursor-not-allowed text-white/60"
              : "bg-[#E10600] hover:shadow-xl hover:scale-[1.02]"
          }
        `}
        >
          {isLoading ? t("sending") : t("send")}
        </button>
      </div>

      {/* Mensajes */}
      {isSuccess && (
        <p className="text-emerald-400 mt-4 text-sm font-semibold">
          {t("successMessage") || "Se envió el reclamo correctamente."}
        </p>
      )}

      {isError && (
        <p className="text-[#E10600] mt-4 text-sm font-semibold">
          {t("errorMessage") || "Ocurrió un error al enviar el reclamo."}
        </p>
      )}
    </div>
  );
};

export default InformError;
