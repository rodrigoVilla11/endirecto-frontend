import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type ArticlesEquivalencesPagResponse = {
  equivalences: ArticleEquivalence[],
  total: number
}
type ArticleEquivalence = {
  id: string;
  code: string;
  brand: string;
  article_id: string;
  articles_group_id: string;
  deleted_at: string;
};
type CreateArticleEquivalencePayload ={
  id: string;
  code: string;
  brand: string;
  article_id: string;
}

export const articlesEquivalencesApi = createApi({
  reducerPath: "articlesEquivalencesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getArticlesEquivalences: builder.query<ArticlesEquivalencesPagResponse,  { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) => {
        return `/articles-equivalences?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: any): ArticlesEquivalencesPagResponse => {
        // Asumiendo que el backend retorna la estructura correcta
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
    exportArticleEquivalenceExcel: builder.query<Blob, void>({
      query: () => ({
        url: `/articles-equivalences/export?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: 'GET',
      }),
      transformResponse: async (response: Response) => {
        return await response.blob();
      },
    }),
  }),
});

export const {
  useGetArticlesEquivalencesQuery,
  useGetArticleEquivalenceByIdQuery,
  useGetArticleEquivalenceByArticleIdQuery,
  useCreateArticleEquivalenceMutation,
  useExportArticleEquivalenceExcelQuery,
  useImportArticleEquivalenceExcelMutation,
  useLazyExportArticleEquivalenceExcelQuery
} = articlesEquivalencesApi;
