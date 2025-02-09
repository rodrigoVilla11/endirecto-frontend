import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type CrmPrenote = {
  id: string; // ID
  name: string; // Nombre
  deleted_at: Date; // Fecha de eliminación
};

type CrmPrenotePayload = {
  id: string; // ID
  name: string; // Nombre
};

export const crmPrenotesApi = createApi({
  reducerPath: "crmPrenotesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || 'http://localhost:3000',
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
    createCrmPrenote: builder.mutation<CrmPrenote, CrmPrenotePayload>({
      query: (newCrmPrenote) => ({
        url: `/crm-prenotes?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newCrmPrenote,
      }),
    }),
    updateCrmPrenote: builder.mutation<CrmPrenote, CrmPrenotePayload>({
      query: ({ id, ...patch }) => ({
        url: `/crm-prenotes/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: patch,
      }),
    }),
    deleteCrmPrenote: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/crm-prenotes/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const { 
  useGetCrmPrenotesQuery, 
  useGetCrmPrenoteByIdQuery, 
  useCreateCrmPrenoteMutation,
  useUpdateCrmPrenoteMutation,
  useDeleteCrmPrenoteMutation,
} = crmPrenotesApi;
