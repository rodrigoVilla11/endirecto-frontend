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

export const documentsApi = createApi({
  reducerPath: "documentsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getDocuments: builder.query<Document[], null>({
      query: () => `/documents?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Document[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron documentos en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getDocumentsPag: builder.query<
      Document[],
      {
        page?: number;
        limit?: number;
        query?: string;
        startDate?: string;
        endDate?: string;
        expirationStatus?: string;
        customer_id?: string
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        query = "",
        startDate,
        endDate,
        expirationStatus,
        customer_id
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
      transformResponse: (response: Document[], meta, arg) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron documentos en la respuesta");
          return [];
        }

        if (arg?.expirationStatus) {
          return response.filter(
            (doc) => doc.expiration_status === arg.expirationStatus
          );
        }

        return response;
      },
    }),

    countDocuments: builder.query<number, null>({
      query: () => {
        return `/documents/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),

    getDocumentById: builder.query<Document, { id: string }>({
      query: ({ id }) => `/documents/findOne/${id}`,
    }),
    sumExpiredAmounts: builder.query<number, null>({
      query: () => {
        return `/documents/sum-expired-amounts?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: { totalExpiredAmount?: string }) => {
        const totalExpiredAmount = response?.totalExpiredAmount;

        if (totalExpiredAmount && !isNaN(parseFloat(totalExpiredAmount))) {
          return parseFloat(totalExpiredAmount);
        }

        return 0; 
      },
    }),

    sumAmounts: builder.query<number, null>({
      query: () => {
        return `/documents/sum-amounts?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: { totalAmount?: string }) => {
        const totalAmount = response?.totalAmount;
    
        
        if (totalAmount && !isNaN(parseFloat(totalAmount))) {
          return parseFloat(totalAmount);
        }
    
        return 0;
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
} = documentsApi;
