import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type ArticleTechnicalDetail = {
  id: string; // ID
  value: string; // Valor de la característica
  article_id: string; // Artículo ID
  articles_group_id: string; // Artículo grupo ID
  technical_detail_id: string; // Característica técnica ID
  deleted_at: Date; // Fecha de eliminación
};

type CreateArticleTechnicalDetailPayload = {
  id: string; // ID
  value: string; // Valor de la característica
  article_id: string; // Artículo ID
  technical_detail_id: string; // Característica técnica ID
};

export const articlesTechnicalDetailsApi = createApi({
  reducerPath: "articlesTechnicalDetailsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getArticlesTechnicalDetails: builder.query<
      ArticleTechnicalDetail[],
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) =>
        `/articles-technical-details?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: ArticleTechnicalDetail[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron articulos en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getArticleTechnicalDetailById: builder.query<
      ArticleTechnicalDetail,
      { id: string }
    >({
      query: ({ id }) => `/articles-technical-details/${id}`,
    }),
    getArticleTechnicalDetailByArticleId: builder.query<
      ArticleTechnicalDetail,
      { articleId: string }
    >({
      query: ({ articleId }) =>
        `/articles-technical-details/by-article/${articleId}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createArticleTechnicalDetail: builder.mutation<
      ArticleTechnicalDetail,
      CreateArticleTechnicalDetailPayload
    >({
      query: (newArticleTechnicalDetail) => ({
        url: `/articles-technical-details?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newArticleTechnicalDetail,
      }),
    }),
    importTechnicalDetailExcel: builder.mutation<
      { totalProcessed: number; successful: number; errors: any[] },
      FormData
    >({
      query: (formData) => ({
        url: `/articles-technical-details/import?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: formData,
      }),
    }),
    exportTechnicalDetailExcel: builder.query<Blob, void>({
      query: () => ({
        url: `/articles-technical-details/export?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "GET",
      }),
      transformResponse: async (response: Response) => {
        return await response.blob();
      },
    }),
  }),
});

export const {
  useGetArticlesTechnicalDetailsQuery,
  useGetArticleTechnicalDetailByIdQuery,
  useGetArticleTechnicalDetailByArticleIdQuery,
  useCreateArticleTechnicalDetailMutation,
  useLazyExportTechnicalDetailExcelQuery,
  useImportTechnicalDetailExcelMutation,
} = articlesTechnicalDetailsApi;
