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
type UpdateItemsPayload = {
  id: string;
  image: string;
};
export const itemsApi = createApi({
  reducerPath: "itemsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getItems: builder.query<Items[], null>({
      query: () => `/items/all?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Items[]) => {
        if (!response || response.length === 0) {
          return [];
        }
        return response;
      },
    }),
    getItemById: builder.query<Items, { id: string }>({
      query: ({ id }) =>
        `/items/findOne/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getItemsPag: builder.query<
      Items[],
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) => {
        return `/items?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: Items[]) => {
        if (!response || response.length === 0) {
          return [];
        }
        return response;
      },
    }),
    countItems: builder.query<number, null>({
      query: () => {
        return `/items/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    updateItem: builder.mutation<Items, UpdateItemsPayload>({
      query: ({ id, ...updatedItem }) => ({
        url: `/items/update-one/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedItem,
      }),
    }),
    exportItemsExcel: builder.query<Blob, { query?: string }>({
      query: ({ query = "" } = {}) => ({
        url: `/items/export?query=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
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
  useGetItemsQuery,
  useGetItemByIdQuery,
  useUpdateItemMutation,
  useCountItemsQuery,
  useGetItemsPagQuery,
  useLazyExportItemsExcelQuery
} = itemsApi;
