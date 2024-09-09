import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type ArticleTechnicalDetail = {
  id: string; // ID
  value: string; // Valor de la característica
  article_id: string; // Artículo ID
  articles_group_id: string; // Artículo grupo ID
  technical_detail_id: string; // Característica técnica ID
  deleted_at: Date; // Fecha de eliminación
};

export const articlesTechnicalDetailsApi = createApi({
  reducerPath: "articlesTechnicalDetailsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getArticlesTechnicalDetails: builder.query<ArticleTechnicalDetail[], null>({
      query: () => `/articles-technical-details?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: ArticleTechnicalDetail[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron articulos en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getArticleTechnicalDetailById: builder.query<ArticleTechnicalDetail, { id: string }>({
      query: ({ id }) => `/articles-technical-details/${id}`,
    }),
  }),
});

export const { useGetArticlesTechnicalDetailsQuery, useGetArticleTechnicalDetailByIdQuery } =
articlesTechnicalDetailsApi;
