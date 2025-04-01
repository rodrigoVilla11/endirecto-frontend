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
          return [];
        }
        return response;
      },
    }),
    getSellerById: builder.query<Seller, { id: string }>({
      query: ({ id }) => `/sellers/${id}`,
    }),
    getSellersPag: builder.query<
    { sellers: Seller[]; total: number },
    { page?: number; limit?: number; query?: string; sort?: string }
  >({
    query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) => {
      return `/sellers/all?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
    },
    transformResponse: (response: any): { sellers: Seller[]; total: number } => {
      if (!response || !response.sellers) {
        return { sellers: [], total: 0 };
      }
      return {
        sellers: response.sellers,
        total: response.total,
      };
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
