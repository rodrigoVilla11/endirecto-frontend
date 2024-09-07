import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Items = {
    id: string; // ID del grupo de artículos
    name: string; // Nombre del grupo de artículos
    image?: string | null; // Imagen del grupo de artículos
    image_uri?: string | null; // URI de la imagen del grupo de artículos
    download_status: string; // Estado de descarga
    family_id?: string | null; // ID de la familia del artículo (puede ser nulo)
    parent_id?: string | null; // ID del grupo padre (puede ser nulo)
};

export const itemsApi = createApi({
  reducerPath: "itemsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || 'http://localhost:3000', // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getItems: builder.query<Items[], null>({
      query: () => `/items?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Items[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron items en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getItemById: builder.query<Items, { id: string }>({
      query: ({ id }) => `/items/${id}`,
    }),
  }),
});

export const { useGetItemsQuery, useGetItemByIdQuery } = itemsApi;
