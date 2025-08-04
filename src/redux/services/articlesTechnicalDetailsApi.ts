import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type ArticleTechnicalDetail = {
  id: string; // ID
  value: string; // Valor de la característica
  article_id: string; // Artículo ID
  articles_group_id: string; // Artículo grupo ID
  technical_detail_id: string; // Característica técnica ID
  deleted_at: Date; // Fecha de eliminación
};

type ArticleTechnicalDetailPagResponse = {
  technical_details: ArticleTechnicalDetail[];
  total: number;
};

type CreateArticleTechnicalDetailPayload = {
  id: string; // ID
  value: string; // Valor de la característica
  article_id: string; // Artículo ID
  technical_detail_id: string; // Característica técnica ID
};

type UpdateArticleTechnicalDetailPayload = {
  id: string; // ID
  value?: string; // Valor de la característica
  article_id?: string; // Artículo ID
  technical_detail_id?: string; // Característica técnica ID
};

export const articlesTechnicalDetailsApi = createApi({
  reducerPath: "articlesTechnicalDetailsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  tagTypes: ['ArticleTechnicalDetail'], // Añadir para cache invalidation
  endpoints: (builder) => ({
    getArticlesTechnicalDetails: builder.query<
      ArticleTechnicalDetailPagResponse,
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) =>
        `/articles-technical-details?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: any): ArticleTechnicalDetailPagResponse => {
        return {
          technical_details: response.technicalDetails,
          total: response.total,
        };
      },
      providesTags: ['ArticleTechnicalDetail'],
    }),
    
    getArticleTechnicalDetailById: builder.query<
      ArticleTechnicalDetail,
      { id: string }
    >({
      query: ({ id }) => `/articles-technical-details/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      providesTags: (result, error, { id }) => [{ type: 'ArticleTechnicalDetail', id }],
    }),
    
    getArticleTechnicalDetailByArticleId: builder.query<
      ArticleTechnicalDetail[],
      { articleId: string }
    >({
      query: ({ articleId }) =>
        `/articles-technical-details/by-article/${articleId}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      providesTags: (result, error, { articleId }) => [
        { type: 'ArticleTechnicalDetail', id: `article-${articleId}` }
      ],
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
      invalidatesTags: ['ArticleTechnicalDetail'],
    }),
    
    updateArticleTechnicalDetail: builder.mutation<
      ArticleTechnicalDetail,
      UpdateArticleTechnicalDetailPayload
    >({
      query: (updateData) => ({
        url: `/articles-technical-details?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ArticleTechnicalDetail', id },
        'ArticleTechnicalDetail'
      ],
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
      invalidatesTags: ['ArticleTechnicalDetail'],
    }),
    
    // CORREGIDO: Cambiar de query a mutation para el export
    exportTechnicalDetailExcel: builder.mutation<
      Blob,
      { query?: string }
    >({
      query: ({ query = "" } = {}) => ({
        url: `/articles-technical-details/export?query=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "GET",
        responseHandler: async (response: Response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error("El archivo descargado está vacío");
          }

          return blob;
        },
      }),
    }),
  }),
});

export const {
  useGetArticlesTechnicalDetailsQuery,
  useGetArticleTechnicalDetailByIdQuery,
  useGetArticleTechnicalDetailByArticleIdQuery,
  useCreateArticleTechnicalDetailMutation,
  useUpdateArticleTechnicalDetailMutation,
  useImportTechnicalDetailExcelMutation,
  // CORREGIDO: Cambiar de lazy query a mutation
  useExportTechnicalDetailExcelMutation,
} = articlesTechnicalDetailsApi;