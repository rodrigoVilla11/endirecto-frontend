import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Collections = {
  _id: string;
  tmp_id?: string; // ID TEMPORAL
  status: "PENDING" | "SENDED" | "SUMMARIZED" | "CHARGED" | "CANCELED"; // ESTADO
  number: string; // NUMERO
  date: string; // FECHA
  amount: number; // IMPORTE BRUTO
  netamount: number; // IMPORTE NETO
  notes?: string; // OBSERVACIONES
  files?: string; // URL DE ARCHIVOS (SEPARADOS POR ;)
  pdf?: string; // URL DE PDF
  customer_id: string; // CLIENTE ID
  collections_summary_id?: string; // RESUMEN DE COBROS ID
  seller_id: string; // VENDEDOR ID
  user_id: string; // USUARIO ID
  branch_id: string;
  deleted_at?: Date; // FECHA DE ELIMINACIÓN
};

type CreateCollectionsPayload = {
  status: "PENDING" | "SENDED" | "SUMMARIZED" | "CHARGED" | "CANCELED"; // ESTADO
  number?: string; // NUMERO
  date: string; // FECHA
  amount: number; // IMPORTE BRUTO
  netamount: number; // IMPORTE NETO
  notes?: string; // OBSERVACIONES
  files?: string; // URL DE ARCHIVOS (SEPARADOS POR ;)
  pdf?: string; // URL DE PDF
  customer_id: string; // CLIENTE ID
  collections_summary_id?: string; // RESUMEN DE COBROS ID
  seller_id: string; // VENDEDOR ID
  user_id: string; // USUARIO ID
  branch_id: string;
  deleted_at?: Date; // FECHA DE ELIMINACIÓN
};

type UpdateCollectionsPayload = {
  _id: string;
  status: "PENDING" | "SENDED" | "SUMMARIZED" | "CHARGED" | "CANCELED"; // ESTADO
};
export const collectionsApi = createApi({
  reducerPath: "collectionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getCollections: builder.query<Collections[], null>({
      query: () => `/collections/all?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Collections[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron pagos en la respuesta");
          return [];
        }
        return response;
      },
    }),

    getCollectionsPag: builder.query<Collections[], { 
      page?: number; 
      limit?: number; 
      status?: string; 
      query?: string; 
      startDate?: string; 
      endDate?: string; 
      seller_id?: string; 
      customer_id?: string
    }>({
      query: ({
        page = 1,
        limit = 10,
        startDate,
        endDate,
        status,
        seller_id,
        customer_id
      } = {}) => {
        const url = `/collections`;
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          token: process.env.NEXT_PUBLIC_TOKEN || "",
        });

        
    
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (status) params.append("status", status);
        if (seller_id) params.append("seller_id", seller_id);
        if (customer_id) params.append("customer_id", customer_id);
      

        const fullUrl = `${url}?${params.toString()}`;
        return fullUrl;
      },
      transformResponse: (response: Collections[], meta, arg) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron documentos en la respuesta");
          return []; 
        }
        return response;
      },
    }),
    
    getCollectionById: builder.query<Collections, { id: string }>({
      query: ({ id }) =>
        `/collections/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createCollection: builder.mutation<Collections, CreateCollectionsPayload>({
      query: (newCollection) => ({
        url: `/collections?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newCollection,
      }),
    }),
    updateCollection: builder.mutation<Collections, UpdateCollectionsPayload>({
      query: ({ _id, ...updatedCollection }) => ({
        url: `/collections/${_id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedCollection,
      }),
    }),
    deleteCollection: builder.mutation<void, string>({
      query: (id) => ({
        url: `/collections/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
    countCollection: builder.query<number, null>({
      query: () => {
        return `/collections/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
  }),
});

export const {
  useGetCollectionByIdQuery,
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useUpdateCollectionMutation,
  useGetCollectionsPagQuery,
  useCountCollectionQuery,
} = collectionsApi;
