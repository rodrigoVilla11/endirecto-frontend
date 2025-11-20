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
  supplier: string; // Porcentaje de descuento 2
  brand_id: string; // Porcentaje de descuento 2
  relative_quantity: string; // Porcentaje de descuento 2
};

export const documentsDetailsApi = createApi({
  reducerPath: "documentsDetailsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getDocumentsDetails: builder.query<DocumentsDetail[], null>({
      query: () => `/documents-details?token=${process.env.NEXT_PUBLIC_TOKEN}`,
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
    getSumsByIdsAndBrand: builder.query<
      {
        totalRelativeQuantity: number;
        totalQuantity: number;
        totalAmount: number;
      },
      {
        ids: string[];
        brand_id: string;
      }
    >({
      query: ({ ids, brand_id }) => {
        const params = new URLSearchParams({
          token: process.env.NEXT_PUBLIC_TOKEN || "",
          ids: ids.join(","),
          brand_id,
        });
        return `/documents-details/sums-by-brand?${params.toString()}`;
      },
      transformResponse: (response: any) => {
        return {
          totalRelativeQuantity: response?.totalRelativeQuantity || 0,
          totalQuantity: response?.totalQuantity || 0,
          totalAmount: response?.totalAmount || 0,
        };
      },
    }),
  }),
});

export const {
  useGetDocumentsDetailsQuery,
  useGetDocumentsDetailByIdQuery,
  useGetSumsByIdsAndBrandQuery,
} = documentsDetailsApi;
