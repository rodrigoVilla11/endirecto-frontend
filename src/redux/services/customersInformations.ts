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

export interface Document {
  id: string;
  document_balance: string;
  customer_id: string;
  date: string;
  seller_id: string;
  type: string;
  balance: string;
  amount: string;
  expiration_date: string;
  expiration_status: string;
  netamount: string;
  number: string;
  payment_condition_id: string;
}

// Respuesta del endpoint lookup
export interface LookupDocumentsResponse {
  totalData: number;
  data: LookupDocument[];
  totalAmount: number;
}

export interface DocumentsResponse {
  totalData: number;
  data: Document[];
  totalDocumentBalance: number;
}

/** NUEVO: tipo de CustomersInformations alineado al schema */
export interface CustomerInformation {
  id: string;
  customer_id: string;

  // existentes
  documents_balance: string;
  documents_balance_expired: string;

  documents?: Array<{
    id?: string;
    document_balance?: string;
  }>;

  // NUEVOS CAMPOS (schema)
  credit_limit?: string; // Límite de Crédito
  overdue_balance?: string; // Saldo Vencido
  due_soon_balance?: string; // A Vencer
  total_debt?: string; // Total Deuda

  avg_payment_days?: number; // Promedio de Días de Pago
  avg_cheque_days?: number; // Promedio de Cheque (días)
  avg_payment_term_days?: number; // Plazo Promedio de Pago (días)
}

export const customersInformationsApi = createApi({
  reducerPath: "customersInformationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getCustomersInformations: builder.query<CustomerInformation[], null>({
      query: () =>
        `/customers-informations?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

    getCustomerInformationByCustomerId: builder.query<
      CustomerInformation | CustomerInformation[] | null,
      { id?: string }
    >({
      query: ({ id }) =>
        id
          ? `/customers-informations/customer/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`
          : `/customers-informations/customer?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

    getCustomerWithDocuments: builder.query<
      CustomerInformation,
      { id: string }
    >({
      query: ({ id }) =>
        `/customers-informations/${id}/documents?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),

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
        type?: string;
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
        type,
      }) => {
        let queryString = `/customers-informations/lookup-documents?token=${process.env.NEXT_PUBLIC_TOKEN}`;
        if (sortField) queryString += `&sortField=${sortField}`;
        if (type) queryString += `&type=${type}`;
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

    getAllDocuments: builder.query<
      DocumentsResponse,
      {
        sortField?: string;
        sortOrder?: "asc" | "desc";
        startDate?: string;
        endDate?: string;
        customerId?: string;
        sellerId?: string;
        page?: number;
        limit?: number;
        type?: string;
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
        type,
      }) => {
        let queryString = `/customers-informations/customers-documents?token=${process.env.NEXT_PUBLIC_TOKEN}`;
        if (sortField) queryString += `&sortField=${sortField}`;
        if (type) queryString += `&type=${type}`;
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

    // Resumen balances (si tu backend sigue devolviendo numbers, lo dejamos así)
    getBalancesSummary: builder.query<
      { documents_balance: number; documents_balance_expired: number },
      { customerId?: string; sellerId?: string }
    >({
      query: ({ customerId, sellerId }) => {
        let queryString = `/customers-informations/balances-summary?token=${process.env.NEXT_PUBLIC_TOKEN}`;
        if (customerId) queryString += `&customerId=${customerId}`;
        if (sellerId) queryString += `&sellerId=${sellerId}`;
        return queryString;
      },
    }),

    exportDocuments: builder.query<
      Blob,
      {
        sortField?: string;
        sortOrder?: "asc" | "desc";
        startDate?: string;
        endDate?: string;
        customerId?: string;
        sellerId?: string;
        type?: string;
      }
    >({
      query: ({
        sortField,
        sortOrder,
        startDate,
        endDate,
        customerId,
        sellerId,
        type,
      }) => {
        let url = `/customers-informations/export?token=${process.env.NEXT_PUBLIC_TOKEN}`;
        if (sortField) url += `&sortField=${sortField}`;
        if (sortOrder) url += `&sortOrder=${sortOrder}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        if (customerId) url += `&customerId=${customerId}`;
        if (sellerId) url += `&sellerId=${sellerId}`;
        if (type) url += `&type=${type}`;

        return {
          url,
          method: "GET",
          responseHandler: async (response) => await response.blob(),
        };
      },
    }),
  }),
});

export const {
  useGetCustomersInformationsQuery,
  useGetCustomerInformationByCustomerIdQuery,
  useGetCustomerWithDocumentsQuery,
  useGetLookupDocumentsQuery,
  useGetAllDocumentsQuery,
  useGetBalancesSummaryQuery,
  useLazyExportDocumentsQuery,
} = customersInformationsApi;
