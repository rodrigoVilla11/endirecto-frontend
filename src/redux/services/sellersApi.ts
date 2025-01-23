import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Seller = {
  id: string; // ID de la persona
  name: string; // Nombre de la persona
  branch_id: string; // ID de la sucursal
  deleted_at?: Date | null; // Fecha de eliminación (opcional)
};

export const sellersApi = createApi({
  reducerPath: "sellersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getSellers: builder.query<Seller[], null>({
      query: () => `/sellers?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Seller[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron vendedores en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getSellerById: builder.query<Seller, { id: string }>({
      query: ({ id }) => `/sellers/${id}`,
    }),
    getSellersPag: builder.query<
      Seller[],
      { page?: number; limit?: number; query?: string }
    >({
      query: ({ page = 1, limit = 10, query = "" } = {}) => {
        return `/sellers/all?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: Seller[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron vendedores en la respuesta");
          return [];
        }
        return response;
      },
    }),

    countSellers: builder.query<number, null>({
      query: () => {
        return `/sellers/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
  }),
});

export const {
  useGetSellersQuery,
  useGetSellerByIdQuery,
  useGetSellersPagQuery,
  useCountSellersQuery,
} = sellersApi;
