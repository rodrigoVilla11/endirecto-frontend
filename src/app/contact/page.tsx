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

      const title =
        `Nuevo mensaje de contacto de  ${customer.id} - ${customer.name}`;

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
      <div className="w-full mx-auto p-6">
        <div className="bg-white shadow-md rounded-md p-6 space-y-4 flex flex-col justify-center max-w-xl mx-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              {t("contact")}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-700"
              >
                {t("name")}
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-gray-100"
                required
                disabled
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="telefono"
                className="block text-sm font-medium text-gray-700"
              >
                {t("phone")}
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-gray-100"
                disabled
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="correoElectronico"
                className="block text-sm font-medium text-gray-700"
              >
                {t("email")}
              </label>
              <input
                type="email"
                id="correoElectronico"
                name="correoElectronico"
                value={formData.correoElectronico}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-gray-100"
                disabled
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="comentario"
                className="block text-sm font-medium text-gray-700"
              >
                {t("comment")}
              </label>
              <textarea
                id="comentario"
                name="comentario"
                value={formData.comentario}
                onChange={handleChange}
                rows={4}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                required
              />
            </div>

            {/* Mensajes de feedback */}
            {successMsg && (
              <p className="text-sm text-green-600 font-medium">{successMsg}</p>
            )}
            {errorMsg && (
              <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSending}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  isSending
                    ? "bg-green-300 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {isSending ? t("sending") || "Enviando..." : t("send")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default Page;
