import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Brands = {
    id: string; 
    name: string;
    images: string[];
    sequence: string;
};

type UpdateBrandsPayload = {
  id: string; 
  images: string[];
  sequence: string;
};

export const brandsApi = createApi({
  reducerPath: "brandsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || 'http://localhost:3000', // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getBrands: builder.query<Brands[], null>({
      query: () => `/brands?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Brands[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron usuarios en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getBrandById: builder.query<Brands, { id: string }>({
      query: ({ id }) => `/brands/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getBrandsPag: builder.query<Brands[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 } = {}) => {
        return `/brands?page=${page}&limit=${limit}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: Brands[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron marcas en la respuesta");
          return [];
        }
        return response;
      },
    }),
    countBrands: builder.query<number, null>({
      query: () => {
        return `/brands/count-all?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    updateBrand: builder.mutation<Brands, UpdateBrandsPayload>({
      query: ({ id, ...updatedBrand }) => ({
        url: `/brands/update-one/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedBrand,
      }),
    }),
  }),
});

export const { useGetBrandsQuery, useGetBrandByIdQuery, useCountBrandsQuery, useGetBrandsPagQuery, useUpdateBrandMutation } = brandsApi;
