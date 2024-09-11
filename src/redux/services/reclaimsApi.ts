import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Reclaims = {
  _id: string;
  id: string;
  status: 'PENDING' | 'ANSWERED'; 
  date: string;
  document_type_number?: string;
  description: string;
  files?: string;
  date_solved?: string;
  cause?: string;
  public_solution?: string;
  internal_solution?: string;
  valid: 'S' | 'N';
  article_id: string;
  b2c_store_id?: string;
  branch_id: string;
  customer_id: string;
  document_id?: string;
  reclaims_type_id: string;
  seller_id?: string;
  user_id?: string;
  user_solved_id?: string;
  deleted_at?: string;
};

export const reclaimsApi = createApi({
  reducerPath: "reclaimsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getReclaims: builder.query<Reclaims[], null>({
      query: () => `/reclaims?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Reclaims[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron faqs en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getReclaimById: builder.query<Reclaims, { id: string }>({
      query: ({ id }) => `/reclaims/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
  }),
});

export const { useGetReclaimsQuery, useGetReclaimByIdQuery } = reclaimsApi;
