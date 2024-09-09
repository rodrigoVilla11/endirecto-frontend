import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type PricesList = {
  id: string; // ID de la lista de precios
  name: string; // Nombre de la lista de precios
  default: string; // Indicador de si es la lista de precios por defecto (S/N)
};

export const pricesListsApi = createApi({
  reducerPath: "pricesListsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getPricesLists: builder.query<PricesList[], null>({
      query: () => `/prices-lists?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: PricesList[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron clientes en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getPricesListById: builder.query<PricesList, { id: string }>({
      query: ({ id }) => `/prices-lists/${id}`,
    }),
  }),
});

export const { useGetPricesListsQuery, useGetPricesListByIdQuery } =
  pricesListsApi;
