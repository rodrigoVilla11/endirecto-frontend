import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ArticlesVehiclesPagResponse {
  vehicles: ArticleVehicle[];
  total: number;
}

export type ArticleVehicle = {
  id: string;
  brand: string;
  model: string;
  engine?: string;
  year?: string;
  year_from?: number;
  year_to?: number;
  article_id: string;
  articles_group_id: string;
  deleted_at: Date;
};

export type CreateArticleVehiclePayload = {
  id: string;
  article_id: string;
  brand: string;
  engine: string;
  model: string;
  year: string;
};

// Definición de tipos para cada consulta separada
export interface VehicleBrandsResponse {
  brands: string[];
}

export interface VehicleModelsResponse {
  models: string[];
}

export interface VehicleEnginesResponse {
  engines: string[];
}

export interface VehicleYearsResponse {
  years: string[];
}

export const articlesVehiclesApi = createApi({
  reducerPath: "articlesVehiclesApi",
  baseQuery: fetchBaseQuery({
    baseUrl:
      process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getArticlesVehicles: builder.query<ArticleVehicle[], null>({
      query: () =>
        `/articles-vehicles?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getArticlesVehiclesPag: builder.query<
      ArticlesVehiclesPagResponse,
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) => {
        return `/articles-vehicles?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: any): ArticlesVehiclesPagResponse => ({
        vehicles: response.vehicles,
        total: response.total,
      }),
    }),
    getArticleVehicleById: builder.query<ArticleVehicle, { id: string }>({
      query: ({ id }) => `/articles-vehicles/${id}`,
    }),

    // ✅ Obtener solo marcas de vehículos
    getArticleVehicleBrands: builder.query<string[], null>({
      query: () => `/articles-vehicles/brands?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

    // ✅ Obtener modelos según la marca seleccionada
    getArticleVehicleModels: builder.query<string[], { brand: string }>({
      query: ({ brand }) => `/articles-vehicles/models?brand=${brand}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

    // ✅ Obtener motores según la marca seleccionada
    getArticleVehicleEngines: builder.query<string[], { brand: string }>({
      query: ({ brand }) => `/articles-vehicles/engines?brand=${brand}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

    // ✅ Obtener años según la marca y modelo seleccionados
    getArticleVehicleYears: builder.query<string[], { brand: string; model: string }>({
      query: ({ brand, model }) => `/articles-vehicles/years?brand=${brand}&model=${model}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

    countArticleVehicle: builder.query<number, null>({
      query: () => `/articles-vehicles/count?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

    createArticleVehicle: builder.mutation<ArticleVehicle, CreateArticleVehiclePayload>({
      query: (newArticleVehicle) => ({
        url: `/articles-vehicles?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newArticleVehicle,
      }),
    }),

    updateArticleVehicle: builder.mutation<
      ArticleVehicle,
      { id: string } & Partial<CreateArticleVehiclePayload>
    >({
      query: ({ id, ...patch }) => ({
        url: `/articles-vehicles/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: patch,
      }),
    }),

    deleteArticleVehicle: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/articles-vehicles/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),

    importArticleVehiclesExcel: builder.mutation<
      { totalProcessed: number; successful: number; errors: any[] },
      FormData
    >({
      query: (formData) => ({
        url: `/articles-vehicles/import?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: formData,
      }),
    }),

    exportArticleVehiclesExcel: builder.query<Blob, void>({
      query: () => ({
        url: `/articles-vehicles/export?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "GET",
      }),
      transformResponse: async (response: Response) => {
        return await response.blob();
      },
    }),
  }),
});

export const {
  useGetArticlesVehiclesQuery,
  useGetArticleVehicleByIdQuery,
  useCountArticleVehicleQuery,
  useGetArticlesVehiclesPagQuery,
  useCreateArticleVehicleMutation,
  useUpdateArticleVehicleMutation,
  useDeleteArticleVehicleMutation,
  useImportArticleVehiclesExcelMutation,
  useExportArticleVehiclesExcelQuery,
  useLazyExportArticleVehiclesExcelQuery,
  useGetArticleVehicleBrandsQuery,  // ✅ Obtener marcas
  useGetArticleVehicleModelsQuery,  // ✅ Obtener modelos según marca
  useGetArticleVehicleEnginesQuery, // ✅ Obtener motores según marca
  useGetArticleVehicleYearsQuery,   // ✅ Obtener años según marca y modelo
} = articlesVehiclesApi;
