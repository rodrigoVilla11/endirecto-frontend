import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type DocumentsDetail = {
    id: string; // ID del detalle del documento
    document_id: string; // ID del documento al que pertenece este detalle
    quantity: string; // Cantidad del artículo en el detalle
    total: string; // Total del detalle
    article_id: string; // ID del artículo
    price: string; // Precio unitario del artículo
    netprice: string; // Precio neto del artículo
    percentage_1: string; // Porcentaje de descuento 1
    percentage_2: string; // Porcentaje de descuento 2
};

export const documentsDetailsApi = createApi({
  reducerPath: "documentsDetailsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getDocumentsDetails: builder.query<DocumentsDetail[], null>({
      query: () =>
        `/documents-details?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: DocumentsDetail[]) => {
        if (!response || response.length === 0) {
          return [];
        }
        return response;
      },
    }),
    getDocumentsDetailById: builder.query<DocumentsDetail, { id: string }>({
      query: ({ id }) => `/documents-details/${id}`,
    }),
  }),
});

export const {
  useGetDocumentsDetailsQuery,
  useGetDocumentsDetailByIdQuery,
} = documentsDetailsApi;