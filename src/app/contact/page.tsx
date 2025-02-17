"use client";
import React, { useState, useEffect } from "react";
import PrivateRoute from "../context/PrivateRoutes";
import { useClient } from "../context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useTranslation } from "react-i18next";

const Page = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();

  const { data, error, isLoading, refetch } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    correoElectronico: "",
    comentario: "",
  });

  // Actualizar el estado cuando `data` cambie
  useEffect(() => {
    if (data) {
      setFormData({
        nombre: data.name || "",
        telefono: data.phone || "",
        correoElectronico: data.email || "",
        comentario: "",
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // onSubmit(formData)
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return <div>{t("loading")}</div>;
  }

  if (error) {
    return <div>{t("errorLoadingData")}</div>;
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"]}>
      <div className="w-full mx-auto p-6">
        <div className="bg-white shadow-md rounded-md p-6 space-y-4 flex flex-col justify-center">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">{t("contact")}</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                {t("name")}
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                required
                disabled
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                {t("phone")}
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                disabled
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="correoElectronico" className="block text-sm font-medium text-gray-700">
                {t("email")}
              </label>
              <input
                type="email"
                id="correoElectronico"
                name="correoElectronico"
                value={formData.correoElectronico}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                disabled
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="comentario" className="block text-sm font-medium text-gray-700">
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

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                {t("send")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default Page;
