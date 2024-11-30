import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type ReclaimsType = {
  id: string; // ID
  name: string; // Nombre
  email: string; // Email
  required_information: string; // Información requerida
  procedure: string; // Procedimiento
  days_control: number; // Período en días para envío de recordatorio
  article_required: boolean; // Requiere artículo
  document_required: boolean; // Requiere comprobante
  file_required: boolean; // Requiere archivo
  available_for_customer: boolean; // Disponible para el cliente
  notice_customer: boolean; // Notificar al cliente
  parent_id: string; // Tipo de reclamo ID
  deleted_at: Date; // Fecha de eliminación
};

export const reclaimsTypesApi = createApi({
  reducerPath: "reclaimsTypesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getReclaimsTypes: builder.query<ReclaimsType[], null>({
      query: () => `/reclaims-types?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: ReclaimsType[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron clientes en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getReclaimsTypeById: builder.query<ReclaimsType, { id: string }>({
      query: ({ id }) => `/reclaims-types/${id}`,
    }),
  }),
});

export const { useGetReclaimsTypesQuery, useGetReclaimsTypeByIdQuery } = reclaimsTypesApi;
