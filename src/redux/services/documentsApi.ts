import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Document = {
  id: string; // ID del documento
  type: string; // Tipo de documento
  number: string; // Número de documento
  date: string; // Fecha del documento
  netamount: string; // Monto neto
  amount: string; // Monto total
  balance: string; // Saldo
  customer_id: string; // ID del cliente
  payment_condition_id?: string | null; // ID de condición de pago (puede ser null)
  seller_id: string; // ID del vendedor
  expiration_date: string; // Fecha de vencimiento
  expiration_status: string; // Estado de vencimiento
  branch_id: string; // ID de la sucursal
  transport_id?: string | null; // ID de transporte (puede ser null)
  deleted_at?: string | null; // Fecha de eliminación (puede ser null)
};

// Tipo para la data mensual de facturación (invoices)
export type InvoiceMonthly = {
  month: number;
  totalSales: number;
  totalQty: number;
};

export const documentsApi = createApi({
  reducerPath: "documentsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getDocuments: builder.query<Document[], null>({
      query: () => `/documents/all?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Document[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron documentos en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getDocumentsPag: builder.query<
      { documents: Document[]; total: number },
      {
        page?: number;
        limit?: number;
        query?: string;
        startDate?: string;
        endDate?: string;
        expirationStatus?: string;
        customer_id?: string;
        sort?: string;
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        query = "",
        startDate,
        endDate,
        expirationStatus,
        customer_id,
        sort = "",
      } = {}) => {
        const url = `/documents`;
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          q: query,
          token: process.env.NEXT_PUBLIC_TOKEN || "",
        });
    
        if (customer_id) {
          params.append("customer_id", customer_id);
        }
        if (sort) {
          params.append("sort", sort);
        }
        if (startDate) {
          params.append("startDate", startDate);
        }
        if (endDate) {
          params.append("endDate", endDate);
        }
        if (expirationStatus) {
          params.append("status", expirationStatus);
        }
    
        return `${url}?${params.toString()}`;
      },
      transformResponse: (
        response: any,
        meta,
        arg
      ): { documents: Document[]; total: number } => {
        if (!response || !response.documents) {
          console.error("No se recibieron documentos en la respuesta");
          return { documents: [], total: 0 };
        }
        let docs = response.documents;
        if (arg?.expirationStatus) {
          docs = docs.filter((doc: Document) => doc.expiration_status === arg.expirationStatus);
        }
        return { documents: docs, total: response.total || 0 };
      },
    }),
    countDocuments: builder.query<number, null>({
      query: () => `/documents/count?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getDocumentById: builder.query<Document, { id: string }>({
      query: ({ id }) => `/documents/findOne/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    sumExpiredAmounts: builder.query<number, null>({
      query: () => `/documents/sum-expired-amounts?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: { totalExpiredAmount?: string }) => {
        const totalExpiredAmount = response?.totalExpiredAmount;
        if (totalExpiredAmount && !isNaN(parseFloat(totalExpiredAmount))) {
          return parseFloat(totalExpiredAmount);
        }
        return 0;
      },
    }),
    sumAmounts: builder.query<
      number,
      {
        startDate?: string;
        endDate?: string;
        type?: string;
        seller_id?: string;
        customer_id?: string;
      }
    >({
      query: ({ startDate, endDate, type, seller_id, customer_id } = {}) => {
        const params = new URLSearchParams({
          token: process.env.NEXT_PUBLIC_TOKEN || "",
        });
        if (startDate) {
          params.append("startDate", startDate);
        }
        if (endDate) {
          params.append("endDate", endDate);
        }
        if (customer_id) {
          params.append("customer_id", customer_id);
        }
        if (type) {
          params.append("type", type);
        }
        if (seller_id) {
          params.append("seller_id", seller_id);
        }
        return `/documents/sum-amounts?${params.toString()}`;
      },
      transformResponse: (response: { totalAmount?: string }) => {
        const totalAmount = response?.totalAmount;
        if (totalAmount && !isNaN(parseFloat(totalAmount))) {
          return parseFloat(totalAmount);
        }
        return 0;
      },
    }),
    // Nuevo endpoint para obtener la facturación mensual (invoices)
    getMonthlyInvoices: builder.query<
      InvoiceMonthly[],
      { startDate: string; endDate: string; brand?: string; item?: string }
    >({
      query: ({ startDate, endDate, brand, item }) => {
        const params = new URLSearchParams({
          token: process.env.NEXT_PUBLIC_TOKEN || "",
          startDate,
          endDate,
        });
        if (brand) params.append("brand", brand);
        if (item) params.append("item", item);
        return `/documents/monthly-invoices?${params.toString()}`;
      },
      transformResponse: (response: any): InvoiceMonthly[] => {
        if (!response || !Array.isArray(response)) {
          console.error("Respuesta inesperada para getMonthlyInvoices", response);
          return [];
        }
        return response.map((d: any) => ({
          month: Number(d.month),
          totalSales: parseFloat(d.totalSales),
          totalQty: d.totalQty ? Number(d.totalQty) : 0,
        }));
      },
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useGetDocumentByIdQuery,
  useGetDocumentsPagQuery,
  useCountDocumentsQuery,
  useSumExpiredAmountsQuery,
  useSumAmountsQuery,
  useGetMonthlyInvoicesQuery,
} = documentsApi;
