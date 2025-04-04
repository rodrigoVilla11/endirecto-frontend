import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type ArticleDiscount = {
  id: string; // ID del descuento por cantidad
  quantity_from: number; // Cantidad desde la cual aplica el descuento
  quantity_to: number; // Cantidad hasta la cual aplica el descuento
  percentage: number; // Porcentaje de descuento
};

export const articlesDiscountsApi = createApi({
  reducerPath: "articlesDiscountsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getArticlesDiscounts: builder.query<ArticleDiscount[], null>({
      query: () => `/articles-discounts?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: ArticleDiscount[]) => {
        if (!response || response.length === 0) {
          return [];
        }
        return response;
      },
    }),
    getArticleDiscountById: builder.query<ArticleDiscount, { id: string }>({
      query: ({ id }) => `/articles-discounts/${id}`,
    }),
  }),
});

export const { useGetArticlesDiscountsQuery, useGetArticleDiscountByIdQuery } =
articlesDiscountsApi;
