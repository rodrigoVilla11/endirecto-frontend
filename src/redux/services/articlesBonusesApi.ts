import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type ArticleBonus = {
  id: string;
  percentage_1: number;
  percentage_2: number;
  percentage_3: number;
  percentage_4: number;
  percentage_code: string;
  article_id: string;
  brand_id: string;
  customer_id: string;
  item_id: string;
  deleted_at: string;
};

export const articlesBonusesApi = createApi({
  reducerPath: "articlesBonusesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getArticlesBonuses: builder.query<ArticleBonus[], null>({
      query: () =>
        `/articles-bonuses/all?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: ArticleBonus[]) => {
        if (!response || response.length === 0) {
          console.error(
            "No se recibieron bonificaciones de articulos en la respuesta"
          );
          return [];
        }
        return response;
      },
    }),
    getArticleBonusById: builder.query<ArticleBonus, { id: string }>({
      query: ({ id }) =>
        `/articles-bonuses/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getArticlesBonusesPag: builder.query<
      ArticleBonus[],
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) => {
        return `/articles-bonuses?q=${query}&page=${page}&limit=${limit}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: ArticleBonus[]) => {
        if (!response || response.length === 0) {
          console.error(
            "No se recibieron bonificaciones de articlos en la respuesta"
          );
          return [];
        }
        return response;
      },
    }),
    countArticlesBonuses: builder.query<number, null>({
      query: () => {
        return `/articles-bonuses/count-all?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    getArticleBonusByItemId: builder.query<ArticleBonus, { id: string }>({
      query: ({ id }) =>
        `/articles-bonuses/item/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
  }),
});

export const {
  useGetArticlesBonusesQuery,
  useGetArticleBonusByIdQuery,
  useGetArticlesBonusesPagQuery,
  useCountArticlesBonusesQuery,
  useGetArticleBonusByItemIdQuery,
} = articlesBonusesApi;
