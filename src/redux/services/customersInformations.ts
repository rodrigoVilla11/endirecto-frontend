import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type CustomerInformation = {
  id: string; // ID
  documents_balance: string[]; // Documentos con saldo vencido
};

export const customersInformationsApi = createApi({
  reducerPath: "customersInformationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getCustomersInformations: builder.query<CustomerInformation[], null>({
      query: () =>
        `/customers-informations?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: CustomerInformation[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron sucursales en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getCustomerInformationById: builder.query<
      CustomerInformation,
      { id: string }
    >({
      query: ({ id }) => `/customers-informations/${id}`,
    }),
  }),
});

export const {
  useGetCustomersInformationsQuery,
  useGetCustomerInformationByIdQuery,
} = customersInformationsApi;
