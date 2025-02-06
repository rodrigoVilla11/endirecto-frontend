import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Interfaz para cada documento obtenido vía lookup
export interface LookupDocument {
  id: string;
  balance: string;
  amount: string;
  customer_id: string;
  date: string;
  expiration_date: string;
  expiration_status: string;
  netamount: string;
  number: string;
  payment_condition_id: string;
  seller_id: string;
  type: string;
}

// Interfaz para la respuesta del endpoint lookup
export interface LookupDocumentsResponse {
  totalData: number;
  data: LookupDocument[];
}

// (Si ya tienes definidos otros tipos, puedes ajustarlos o incluirlos aquí según corresponda)
export const customersInformationsApi = createApi({
  reducerPath: "customersInformationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    // Otros endpoints que ya tengas definidos...
    getCustomersInformations: builder.query<any, null>({
      query: () =>
        `/customers-informations?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    // Permitiendo que id sea opcional
    getCustomerInformationByCustomerId: builder.query<
      any,
      { id?: string }
    >({
      query: ({ id }) =>
        id
          ? `/customers-informations/customer/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`
          : `/customers-informations/customer?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

    getCustomerWithDocuments: builder.query<any, { id: string }>({
      query: ({ id }) =>
        `/customers-informations/${id}/documents?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    // Nuevo endpoint para obtener todos los documentos (lookup)
    getLookupDocuments: builder.query<
      LookupDocumentsResponse,
      {
        sortField?: string;
        sortOrder?: "asc" | "desc";
        startDate?: string;
        endDate?: string;
        customerId?: string;
        sellerId?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({
        sortField,
        sortOrder,
        startDate,
        endDate,
        customerId,
        sellerId,
        page,
        limit,
      }) => {
        let queryString = `/customers-informations/lookup-documents?token=${process.env.NEXT_PUBLIC_TOKEN}`;
        if (sortField) queryString += `&sortField=${sortField}`;
        if (sortOrder) queryString += `&sortOrder=${sortOrder}`;
        if (startDate) queryString += `&startDate=${startDate}`;
        if (endDate) queryString += `&endDate=${endDate}`;
        if (customerId) queryString += `&customerId=${customerId}`;
        if (sellerId) queryString += `&sellerId=${sellerId}`;
        if (page !== undefined) queryString += `&page=${page}`;
        if (limit !== undefined) queryString += `&limit=${limit}`;
        return queryString;
      },
    }),
  }),
});

export const {
  useGetCustomersInformationsQuery,
  useGetCustomerInformationByCustomerIdQuery,
  useGetCustomerWithDocumentsQuery,
  useGetLookupDocumentsQuery,
} = customersInformationsApi;
