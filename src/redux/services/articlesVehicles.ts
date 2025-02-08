import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type ArticleVehicle = {
  id: string; // ID
  brand: string; // Marca vehículo
  model: string; // Modelo vehículo
  engine?: string; // Motor vehículo
  year?: string; // Año vehículo
  year_from?: number; // Año desde vehículo
  year_to?: number; // Año hasta vehículo
  article_id: string; // Artículo ID
  articles_group_id: string; // Artículo grupo ID
  deleted_at: Date; // Fecha de eliminación
};

type CreateArticleVehiclePayload = {
  id: string;
  article_id: string;
  brand: string;
  engine: string;
  model: string;
  year: string;
};

export const articlesVehiclesApi = createApi({
  reducerPath: "articlesVehiclesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getArticlesVehicles: builder.query<ArticleVehicle[], null>({
      query: () => `/articles-vehicles?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: ArticleVehicle[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron articulos en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getArticlesVehiclesPag: builder.query<
      ArticleVehicle[],
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) => {
        return `/articles-vehicles?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: ArticleVehicle[]) => {
        if (!response || response.length === 0) {
          console.error(
            "No se recibieron aplicaciones de articulos en la respuesta"
          );
          return [];
        }
        return response;
      },
    }),
    getArticleVehicleById: builder.query<ArticleVehicle, { id: string }>({
      query: ({ id }) => `/articles-vehicles/${id}`,
    }),
    countArticleVehicle: builder.query<number, null>({
      query: () => {
        return `/articles-vehicles/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    createArticleVehicle: builder.mutation<
      ArticleVehicle,
      CreateArticleVehiclePayload
    >({
      query: (newArticleVehicle) => ({
        url: `/articles-vehicles?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newArticleVehicle,
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
        method: 'GET',
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
  useImportArticleVehiclesExcelMutation,
  useExportArticleVehiclesExcelQuery,
  useLazyExportArticleVehiclesExcelQuery
} = articlesVehiclesApi;
