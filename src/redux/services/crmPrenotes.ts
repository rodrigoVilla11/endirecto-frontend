import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type CrmPrenote = {
    id: string; // ID
    name: string; // Nombre
    deleted_at: Date; // Fecha de eliminación
};

export const crmPrenotesApi = createApi({
  reducerPath: "crmPrenotesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || 'http://localhost:3000', // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getCrmPrenotes: builder.query<CrmPrenote[], null>({
      query: () => `/crm-prenotes?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: CrmPrenote[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron sucursales en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getCrmPrenoteById: builder.query<CrmPrenote, { id: string }>({
      query: ({ id }) => `/crm-prenotes/${id}`,
    }),
  }),
});

export const { useGetCrmPrenotesQuery, useGetCrmPrenoteByIdQuery } = crmPrenotesApi;
