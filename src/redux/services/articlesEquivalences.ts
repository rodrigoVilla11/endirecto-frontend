import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type ArticlesEquivalencesPagResponse = {
  equivalences: ArticleEquivalence[];
  total: number;
};
type ArticleEquivalence = {
  id: string;
  code: string;
  brand: string;
  article_id: string;
  articles_group_id: string;
  deleted_at: string;
};
type CreateArticleEquivalencePayload = {
  id: string;
  code: string;
  brand: string;
  article_id: string;
};
type UpdateArticleEquivalencePayload = {
  id: string;
  code?: string;
  brand?: string;
  article_id?: string;
  articles_group_id?: string;
};

export const articlesEquivalencesApi = createApi({
  reducerPath: "articlesEquivalencesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getArticlesEquivalences: builder.query<
      ArticlesEquivalencesPagResponse,
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) => {
        return `/articles-equivalences?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: any): ArticlesEquivalencesPagResponse => {
        return {
          equivalences: response.equivalences,
          total: response.total,
        };
      },
    }),
    getArticleEquivalenceById: builder.query<
      ArticleEquivalence,
      { id: string }
    >({
      query: ({ id }) => `/articles-equivalences/${id}`,
    }),
    getArticleEquivalenceByArticleId: builder.query<
      ArticleEquivalence,
      { articleId: string }
    >({
      query: ({ articleId }) =>
        `/articles-equivalences/by-article/${articleId}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createArticleEquivalence: builder.mutation<
      ArticleEquivalence,
      CreateArticleEquivalencePayload
    >({
      query: (newArticleEquivalence) => ({
        url: `/articles-equivalences?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newArticleEquivalence,
      }),
    }),
    updateArticleEquivalence: builder.mutation<
      ArticleEquivalence,
      UpdateArticleEquivalencePayload
    >({
      query: (payload) => ({
        url: `/articles-equivalences/${payload.id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: payload,
      }),
    }),
    importArticleEquivalenceExcel: builder.mutation<
      { totalProcessed: number; successful: number; errors: any[] },
      FormData
    >({
      query: (formData) => ({
        url: `/articles-equivalences/import?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: formData,
      }),
    }),
    deleteArticleEquivalence: builder.mutation<
      ArticleEquivalence, // devuelve ArticlesEquivalences
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/articles-equivalences/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
    // Endpoint para exportar a Excel
    exportArticleEquivalenceExcel: builder.query<Blob, { query?: string }>({
      query: ({ query = "" } = {}) => ({
        url: `/articles-equivalences/export?query=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "GET",
        // Importante: configurar para recibir blob
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
  useGetArticlesEquivalencesQuery,
  useGetArticleEquivalenceByIdQuery,
  useGetArticleEquivalenceByArticleIdQuery,
  useCreateArticleEquivalenceMutation,
  useUpdateArticleEquivalenceMutation,
  useImportArticleEquivalenceExcelMutation,
  useLazyExportArticleEquivalenceExcelQuery,
  useDeleteArticleEquivalenceMutation,
} = articlesEquivalencesApi;
