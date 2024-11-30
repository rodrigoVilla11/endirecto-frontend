import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Pending = {
  id: string; // ID del detalle del pedido
  order_id: string; // ID del pedido
  date: Date; // Fecha del pedido
  customer_id: string; // ID del cliente
  article_id: string; // ID del artículo
  quantity: number; // Cantidad del artículo
  price: number; // Precio del artículo
};

export const pendingsApi = createApi({
  reducerPath: "pendingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getPendings: builder.query<Pending[], null>({
      query: () => `/pendings?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Pending[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron clientes en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getPendingById: builder.query<Pending, { id: string }>({
      query: ({ id }) => `/pendings/${id}`,
    }),
  }),
});

export const { useGetPendingsQuery, useGetPendingByIdQuery } = pendingsApi;
