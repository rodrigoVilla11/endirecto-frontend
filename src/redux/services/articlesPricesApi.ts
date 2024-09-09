import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type ArticlePrice = {
  id: string;
  price: number; // PRECIO
  offer: number; // PRECIO DE OFERTA
  outlet: number; // PRECIO DE OUTLET
  article_id: string; // ARTICULO ID
  price_list_id: string; // LISTA DE PRECIO ID
  deleted_at: string; // FECHA DE ELIMINACIÓN
};

export const articlesPricesApi = createApi({
  reducerPath: "articlesPricesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getArticlesPrices: builder.query<ArticlePrice[], null>({
      query: () => `/articles-prices?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: ArticlePrice[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron articulos en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getArticlePriceById: builder.query<ArticlePrice, { id: string }>({
      query: ({ id }) => `/articles-prices/${id}`,
    }),
  }),
});

export const { useGetArticlesPricesQuery, useGetArticlePriceByIdQuery } =
  articlesPricesApi;
