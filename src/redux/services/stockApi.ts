import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Stock = {
  id: string; // ID del stock
  status: string; // Estado del stock (e.g., NO-STOCK)
  quantity: string; // Cantidad en stock
  article_id: string; // ID del artículo
  branch_id: string; // ID de la sucursal
  quantity_next: string; // Cantidad del proximo ingreso
  quantity_next_date: string; // Fecha del proximo ingreso
};

export const stockApi = createApi({
  reducerPath: "stockApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getStock: builder.query<Stock[], null>({
      query: () => `/stocks?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Stock[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron stocks en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getStockById: builder.query<Stock, { id: string }>({
      query: ({ id }) => `/stocks/${id}`,
    }),
    getStockByArticleId: builder.query<Stock, { articleId: string }>({
      query: ({ articleId }) =>
        `/stocks/by-article/${articleId}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getStockPag: builder.query<
    Stock[],
      { page?: number; limit?: number; query?: string }
    >({
      query: ({ page = 1, limit = 10, query = "" } = {}) => {
        return `/stocks?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: Stock[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron stocks en la respuesta");
          return [];
        }
        return response;
      },
    }),

    countStock: builder.query<number, null>({
      query: () => {
        return `/stocks/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
  }),
});

export const {
  useGetStockQuery,
  useGetStockByIdQuery,
  useGetStockByArticleIdQuery,
  useCountStockQuery,
  useGetStockPagQuery
} = stockApi;
