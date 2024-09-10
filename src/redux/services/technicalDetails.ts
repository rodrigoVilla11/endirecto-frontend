import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type TechnicalDetail = {
  id: string; // ID
  name: string; // Nombre
  deleted_at: Date; // Fecha de eliminación
};

export const technicalDetailsApi = createApi({
  reducerPath: "technicalDetailsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getTechnicalDetails: builder.query<TechnicalDetail[], null>({
      query: () => `/technical-details?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: TechnicalDetail[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron clientes en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getTechnicalDetailById: builder.query<TechnicalDetail, { id: string }>({
      query: ({ id }) => `/technical-details/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
  }),
});

export const { useGetTechnicalDetailsQuery, useGetTechnicalDetailByIdQuery } =
  technicalDetailsApi;
