import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type DocumentsDetail = {
  id: string;
  document_id: string;
  quantity: string;
  total: string;
  article_id: string;
  price: string;
  netprice: string;
  percentage_1: string;
  percentage_2: string;
  supplier: string;
  brand_id: string;
  relative_quantity: string;
};

export const documentsDetailsApi = createApi({
  reducerPath: "documentsDetailsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
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
      query: ({ id }) => `/documents-details/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getSumsByIdsAndBrand: builder.mutation<
      {
        brand_id: string;
        documentCount: number;
        totalRelativeQuantity: number;
        totalQuantity: number;
        totalAmount: number;
      },
      {
        ids: string[];
        brand_id: string;
      }
    >({
      query: ({ ids, brand_id }) => ({
        url: `/documents-details/sums-by-brand?token=${process.env.NEXT_PUBLIC_TOKEN || ""}`,
        method: "POST",
        body: {
          ids: ids,
          brand_id: brand_id,
        },
      }),
      transformResponse: (response: any) => {
        console.log("Respuesta del backend:", response);
        return {
          brand_id: response?.brand_id || "",
          documentCount: response?.documentCount || 0,
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
  useGetSumsByIdsAndBrandMutation, // 👈 Ahora es mutation en lugar de query
} = documentsDetailsApi;