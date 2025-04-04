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
          return [];
        }
        return response;
      },
    }),
    getPricesListById: builder.query<PricesList, { id: string }>({
      query: ({ id }) => `/prices-lists/${id}`,
    }),
    getPricesListPag:builder.query<
    PricesList[],
    { page?: number; limit?: number; query?: string }
  >({
    query: ({ page = 1, limit = 10, query = "" } = {}) => {
      return `/prices-lists?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
    },
    transformResponse: (response: PricesList[]) => {
      if (!response || response.length === 0) {
        return [];
      }
      return response;
    },
  }),

    countPricesLists: builder.query<number, null>({
      query: () => {
        return `/prices-lists/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
  }),
});

export const { useGetPricesListsQuery, useGetPricesListByIdQuery, useGetPricesListPagQuery, useCountPricesListsQuery } =
  pricesListsApi;
