import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type CollectionPaymentsType = {
  id: string; // ID del método de pago
  name: string; // Nombre del método de pago
};

export const collectionsPaymentsTypesApi = createApi({
  reducerPath: "collectionsPaymentsTypesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getCollectionsPaymentsTypes: builder.query<CollectionPaymentsType[], null>({
      query: () => `/collections-payments-types?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: CollectionPaymentsType[]) => {
        if (!response || response.length === 0) {
          return [];
        }
        return response;
      },
    }),
    getCollectionPaymentsTypeById: builder.query<
      CollectionPaymentsType,
      { id: string }
    >({
      query: ({ id }) => `/collections-payments-types/${id}`,
    }),
  }),
});

export const {
  useGetCollectionsPaymentsTypesQuery,
  useGetCollectionPaymentsTypeByIdQuery,
} = collectionsPaymentsTypesApi;
