import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type CustomerInformation = {
  id: string;
  documents_balance: string;
  documents_balance_expired: string;
  customer_id: string;
  documents: Documents[];
};
export interface Documents {
  id: string;
  document_balance: string;
}

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
    getCustomerInformationByCustomerId: builder.query<
      | CustomerInformation
      | {
          total_documents_balance: number;
          total_documents_balance_expired: number;
        },
      { id?: string }
    >({
      query: ({ id }) =>
        id ? `/customers-informations/customer/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}` : `/customers-informations/customer?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
  }),
});

export const {
  useGetCustomersInformationsQuery,
  useGetCustomerInformationByCustomerIdQuery,
} = customersInformationsApi;
