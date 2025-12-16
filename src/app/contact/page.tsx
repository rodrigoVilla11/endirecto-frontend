"use client";
import React, { useState, useEffect } from "react";
import PrivateRoute from "../context/PrivateRoutes";
import { useClient } from "../context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useTranslation } from "react-i18next";
import {
  Roles,
  useAddNotificationToUsersByRolesMutation,
} from "@/redux/services/usersApi";

const Page = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();

  const {
    data: customer,
    error,
    isLoading,
  } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const [addNotificationToUsersByRoles, { isLoading: isSending }] =
    useAddNotificationToUsersByRolesMutation();

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    correoElectronico: "",
    comentario: "",
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Actualizar el estado cuando `customer` cambie
  useEffect(() => {
    if (customer) {
      setFormData({
        nombre: customer.name || "",
        telefono: customer.phone || "",
        correoElectronico: customer.email || "",
        comentario: "",
      });
    }
  }, [customer]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!customer) {
      setErrorMsg(t("errorLoadingData") || "No se encontró el cliente.");
      return;
    }

    try {
      const now = new Date();
      const schedule_from = now;
      const schedule_to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 días

      const title = `Nuevo mensaje de contacto de  ${customer.id} - ${customer.name}`;

      const description = `
Teléfono: ${formData.telefono || "-"}
Email: ${formData.correoElectronico || "-"}

Comentario:
${formData.comentario}
      `.trim();

      await addNotificationToUsersByRoles({
        roles: [Roles.ADMINISTRADOR],
        notification: {
          title,
          type: "CONTACTO",
          description,
          link: "/crm", // ruta que quieras abrir al hacer click
          schedule_from,
          schedule_to,
          customer_id: customer.id,
        },
      }).unwrap();

      setSuccessMsg("Tu mensaje fue enviado al equipo administrativo.");
      // Limpiamos solo el comentario
      setFormData((prev) => ({ ...prev, comentario: "" }));
    } catch (err) {
      console.error(err);
      setErrorMsg(
        t("contactNotificationError") ||
          "No se pudo enviar el mensaje. Intenta nuevamente más tarde."
      );
    }
  };

  if (isLoading) {
    return <div>{t("loading")}</div>;
  }

  if (error) {
    return <div>{t("errorLoadingData")}</div>;
  }

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      return (
      <div className="w-full mx-auto p-6">
        <div className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0B0B0B]">
            <h2 className="text-xl font-extrabold text-white">
              {t("contact")}
              <span className="text-[#E10600]">.</span>
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-[#0B0B0B]">
            <div className="space-y-2">
              <label
                htmlFor="nombre"
                className="block text-sm font-semibold text-white/80"
              >
                {t("name")}
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled
                className="
              w-full p-2 rounded-xl
              bg-white/5 text-white/70
              border border-white/10
              placeholder:text-white/30
              outline-none
              cursor-not-allowed
            "
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="telefono"
                className="block text-sm font-semibold text-white/80"
              >
                {t("phone")}
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                disabled
                required
                className="
              w-full p-2 rounded-xl
              bg-white/5 text-white/70
              border border-white/10
              placeholder:text-white/30
              outline-none
              cursor-not-allowed
            "
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="correoElectronico"
                className="block text-sm font-semibold text-white/80"
              >
                {t("email")}
              </label>
              <input
                type="email"
                id="correoElectronico"
                name="correoElectronico"
                value={formData.correoElectronico}
                onChange={handleChange}
                disabled
                required
                className="
              w-full p-2 rounded-xl
              bg-white/5 text-white/70
              border border-white/10
              placeholder:text-white/30
              outline-none
              cursor-not-allowed
            "
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="comentario"
                className="block text-sm font-semibold text-white/80"
              >
                {t("comment")}
              </label>
              <textarea
                id="comentario"
                name="comentario"
                value={formData.comentario}
                onChange={handleChange}
                rows={4}
                required
                className="
              w-full p-2 rounded-xl resize-none
              bg-white/10 text-white
              border border-white/20
              placeholder:text-white/40
              outline-none transition-all
              focus:border-[#E10600]
              focus:ring-1 focus:ring-[#E10600]/40
            "
              />
            </div>

            {/* Mensajes de feedback */}
            {successMsg && (
              <p className="text-sm font-semibold text-[#E10600] bg-[#E10600]/10 border border-[#E10600]/30 px-3 py-2 rounded-xl">
                {successMsg}
              </p>
            )}
            {errorMsg && (
              <p className="text-sm font-semibold text-[#E10600] bg-[#E10600]/10 border border-[#E10600]/30 px-3 py-2 rounded-xl">
                {errorMsg}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSending}
                className={`
              px-4 py-2 rounded-xl
              text-white font-extrabold
              transition-all
              focus:outline-none
              focus:ring-2 focus:ring-[#E10600]/40
              ${
                isSending
                  ? "bg-white/10 border border-white/10 cursor-not-allowed opacity-70"
                  : "bg-[#E10600] hover:opacity-90 shadow-lg"
              }
            `}
              >
                {isSending ? t("sending") || "Enviando..." : t("send")}
              </button>
            </div>

            {/* Acento marca */}
            <div className="pt-2">
              <div className="h-1 w-full bg-[#E10600] opacity-90 rounded-full" />
            </div>
          </form>
        </div>
      </div>
      );
    </PrivateRoute>
  );
};

export default Page;
