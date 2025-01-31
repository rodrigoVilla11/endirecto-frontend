import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Transport = {
  id: string; // ID del proveedor
  name: string; // Nombre del proveedor
  schedule: string; // Horarios
};

export const transportsApi = createApi({
  reducerPath: "transportsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getTransports: builder.query<Transport[], null>({
      query: () => `/transports?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Transport[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron sucursales en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getTransportById: builder.query<Transport, { id: string }>({
      query: ({ id }) => `/transports/${id}`,
    }),
    countTransports: builder.query<number, null>({
      query: () => {
        return `/transports/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    getTransportsPag: builder.query<
      Transport[],
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) => {
        return `/transports?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: Transport[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron TRANSPORTISTAS en la respuesta");
          return [];
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetTransportsQuery,
  useGetTransportByIdQuery,
  useGetTransportsPagQuery,
  useCountTransportsQuery,
} = transportsApi;
