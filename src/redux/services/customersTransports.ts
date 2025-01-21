import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type CustomerTransport = {
  id: string; // ID del transporte del cliente
  default: string; // Indica si es el transporte por defecto ("S" para sí, "N" para no)
  customer_id: string; // ID del cliente
  transport_id: string; // ID del transporte
};

export const customersTransportsApi = createApi({
  reducerPath: "customersTransportsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getCustomersTransports: builder.query<CustomerTransport[], null>({
      query: () =>
        `/customers-transports?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: CustomerTransport[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron sucursales en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getCustomerTransportById: builder.query<CustomerTransport, { id: string }>({
      query: ({ id }) => `/customers-transports/${id}`,
    }),
    getCustomerTransportByCustomerId: builder.query<CustomerTransport, { id: string }>({
      query: ({ id }) => `/customers-transports/customer/${id}`,
    }),
  }),
});

export const {
  useGetCustomersTransportsQuery,
  useGetCustomerTransportByIdQuery,
  useGetCustomerTransportByCustomerIdQuery
} = customersTransportsApi;
