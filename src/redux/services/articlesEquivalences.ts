import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type ArticleEquivalence = {
    id: string;
    code: string;
    brand: string;
    article_id: string;
    articles_group_id: string;
    deleted_at: string;
};

export const articlesEquivalencesApi = createApi({
  reducerPath: "articlesEquivalencesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getArticlesEquivalences: builder.query<ArticleEquivalence[], null>({
      query: () => `/articles-equivalences?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: ArticleEquivalence[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron articulos en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getArticleEquivalenceById: builder.query<ArticleEquivalence, { id: string }>({
      query: ({ id }) => `/articles-equivalences/${id}`,
    }),
  }),
});

export const { useGetArticlesEquivalencesQuery, useGetArticleEquivalenceByIdQuery } =
articlesEquivalencesApi;
