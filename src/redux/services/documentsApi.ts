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
          console.error("No se recibieron sucursales en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getDocumentById: builder.query<Document, { id: string }>({
      query: ({ id }) => `/documents/${id}`,
    }),
  }),
});

export const { useGetDocumentsQuery, useGetDocumentByIdQuery } = documentsApi;
