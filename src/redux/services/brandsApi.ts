import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Brands = {
    id: string; 
    name: string;
    image: string;
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
      query: ({ id }) => `/brands/${id}`,
    }),
  }),
});

export const { useGetBrandsQuery, useGetBrandByIdQuery } = brandsApi;
