import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type BrandTargets = {
  CTR?: string;
  "HI TEC"?: string;
  TRICO?: string;
  CORVEN?: string;
  ZT?: string;
  MO?: string;
  E?: string;
  CHAO?: string;
  CORTIR?: string;
  FA?: string;
  DU?: string;
  LM?: string;
  EM?: string;
  M?: string;
  ELF?: string;
  VARTA?: string;
  ENER?: string;
  RODA?: string;
  [key: string]: string | undefined;
};

type Seller = {
  id: string; // ID de la persona
  name: string; // Nombre de la persona
  branch_id: string; // ID de la sucursal
  target?: BrandTargets;
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
    updateSeller: builder.mutation<
      Seller,
      {
        id: string;
        name?: string;
        branch_id?: string;
        target?: BrandTargets;
      }
    >({
      query: (data) => ({
        url: `/sellers/update`,
        method: "PUT",
        body: [data], // El backend espera un array
        params: {
          token: process.env.NEXT_PUBLIC_TOKEN || "",
        },
      }),
      transformResponse: (response: Seller[]) => {
        return response[0]; // Retornar solo el primer elemento
      },
    }),
    getSellerById: builder.query<Seller, { id: string }>({
      query: ({ id }) => `/sellers/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getSellersPag: builder.query<
      { sellers: Seller[]; total: number },
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) => {
        return `/sellers/all?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (
        response: any
      ): { sellers: Seller[]; total: number } => {
        if (!response || !response.sellers) {
          return { sellers: [], total: 0 };
        }
        return {
          sellers: response.sellers,
          total: response.total,
        };
      },
    }),

    updateSellerTargetBrand: builder.mutation<
      Seller,
      {
        id: string;
        brand_id: string;
        value: string;
      }
    >({
      query: ({ id, brand_id, value }) => ({
        url: `/sellers/update-target-brand`,
        method: "PUT",
        body: {
          id,
          brand_id,
          value,
        },
        params: {
          token: process.env.NEXT_PUBLIC_TOKEN || "",
        },
      }),
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
  useUpdateSellerMutation,
  useUpdateSellerTargetBrandMutation,
} = sellersApi;
