import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type Search = {
  _id: string;
  search: string;
  quantity: number;
};

export type CreateSearchPayload = {
  search: string;
  quantity?: number;
};

export type UpdateSearchPayload = {
  _id: string;
  search?: string;
  quantity?: number;
};

export const searchesApi = createApi({
  reducerPath: "searchesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    // Consulta paginada para búsquedas
    getSearchesPag: builder.query<
      { searches: Search[]; total: number },
      { page?: number; limit?: number; query?: string }
    >({
      query: ({ page = 1, limit = 10, query = "" } = {}) =>
        `/searches?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (
        response: Search[] | { searches: Search[]; total: number }
      ): { searches: Search[]; total: number } => {
        if (Array.isArray(response)) {
          return { searches: response, total: response.length };
        }
        return response;
      },
    }),

    // Consulta para contar todas las búsquedas
    countSearches: builder.query<number, null>({
      query: () => `/searches/count?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

    // Consulta para obtener todas las búsquedas con campos específicos
    getSearches: builder.query<Search[], null>({
      query: () => `/searches/all?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

    // Consulta para obtener una búsqueda por ID
    getSearchById: builder.query<Search, { id: string }>({
      query: ({ id }) =>
        `/searches/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

    // Mutación para crear una búsqueda (o incrementar el quantity si ya existe)
    createSearch: builder.mutation<Search, CreateSearchPayload>({
      query: (newSearch) => ({
        url: `/searches?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newSearch,
      }),
    }),

    // Mutación para actualizar una búsqueda
    updateSearch: builder.mutation<Search, UpdateSearchPayload>({
      query: ({ _id, ...updatedSearch }) => ({
        url: `/searches/${_id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedSearch,
      }),
    }),

    // Mutación para eliminar una búsqueda por ID
    deleteSearch: builder.mutation<Search, string>({
      query: (id) => ({
        url: `/searches/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
    exportSearchesExcel: builder.query<Blob, { query?: string }>({
      query: ({ query = "" } = {}) => ({
        url: `/searches/export?query=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
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
  useGetSearchesPagQuery,
  useCountSearchesQuery,
  useGetSearchesQuery,
  useGetSearchByIdQuery,
  useCreateSearchMutation,
  useUpdateSearchMutation,
  useDeleteSearchMutation,
  useLazyExportSearchesExcelQuery
} = searchesApi;
