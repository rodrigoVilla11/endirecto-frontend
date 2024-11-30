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
      { page?: number; limit?: number; query?: string }
    >({
      query: ({ page = 1, limit = 10, query = "" } = {}) => {
        return `/articles-vehicles?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
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
  }),
});

export const { useGetArticlesVehiclesQuery, useGetArticleVehicleByIdQuery, useCountArticleVehicleQuery, useGetArticlesVehiclesPagQuery } =
  articlesVehiclesApi;
