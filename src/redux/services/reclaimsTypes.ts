import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type ReclaimType = {
  id: string;
  categoria: string;
  tipo?: string;
  deleted_at?: Date | null;
};

export const reclaimsTypesApi = createApi({
  reducerPath: "reclaimsTypesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    // Obtener todos los tipos de reclamo
    getReclaimsTypes: builder.query<ReclaimType[], void>({
      query: () => `/reclaims-types?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: ReclaimType[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron tipos de reclamo en la respuesta");
          return [];
        }
        return response;
      },
    }),
    // Obtener un tipo de reclamo por ID
    getReclaimTypeById: builder.query<ReclaimType, { id: string }>({
      query: ({ id }) => `/reclaims-types/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    // Crear un nuevo tipo de reclamo
    createReclaimType: builder.mutation<ReclaimType, Partial<ReclaimType>>({
      query: (body) => ({
        url: `/reclaims-types?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body,
      }),
    }),
    // Actualizar un tipo de reclamo
    updateReclaimType: builder.mutation<ReclaimType, Partial<ReclaimType> & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/reclaims-types/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PATCH",
        body,
      }),
    }),
    // Eliminar un tipo de reclamo
    deleteReclaimType: builder.mutation<ReclaimType, { id: string }>({
      query: ({ id }) => ({
        url: `/reclaims-types/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const { 
  useGetReclaimsTypesQuery, 
  useGetReclaimTypeByIdQuery, 
  useCreateReclaimTypeMutation, 
  useUpdateReclaimTypeMutation, 
  useDeleteReclaimTypeMutation 
} = reclaimsTypesApi;
