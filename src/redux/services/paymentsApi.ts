// src/redux/services/payments.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/* ========= Tipos ========= */

export type PaymentType = "pago_anticipado" | "cta_cte";
export type PaymentMethodEnum = "efectivo" | "transferencia" | "cheque";
export type PaymentStatus = "confirmed" | "reversed" | "pending";

export interface PaymentTotals {
  gross: number;    // suma base (bruto)
  discount: number; // suma descuentos
  net: number;      // suma final (neto)
  values: number;   // suma valores
  diff: number;     // net - values
}

export interface PaymentDocumentLine {
  document_id: string;
  number: string;
  days_used?: number | null;
  // ej. "pago_anticipado:sin_regla", "cta_cte:<=15d:13%", "cta_cte:>45d:actualizacion"
  rule_applied: string;
  base: number;
  discount_rate: number;   // 0.13, 0.10, etc.
  discount_amount: number; // base * discount_rate
  final_amount: number;    // base - discount_amount
  note?: string;
}

export interface PaymentValueLine {
  amount: number;
  concept: string;
  method: PaymentMethodEnum;
  bank?: string;
  receipt_url?: string;
  receipt_original_name?: string;
  created_at?: string;
}

export interface Payment {
  isImputed: boolean | undefined;
  _id: string;
  status: PaymentStatus;
  multisoft_id?: string;
  customer: { id: string };
  currency: string; // "ARS"
  date: string;     // ISO string
  type: PaymentType; // 👈 ahora "pago_anticipado" | "cta_cte"
  totals: PaymentTotals;
  total: number; // compat: igual a totals.net
  documents: PaymentDocumentLine[];
  payment_condition: { id: string };
  values: PaymentValueLine[];
  user: { id: string };
  seller: { id: string };
  comments?: string;
  source?: string; // "web" | "mobile" | "pos"
  version?: number;
  isCharged: boolean; // default false
  rendido: boolean;   // default false
  created_at: string;
  updated_at: string;

  // Cuando se usa includeLookup=true en el backend:
  document_details?: Array<{
    id: string;
    amount?: number;
    netamount?: number;
    customer_id?: string;
    date?: string;
    expiration_date?: string;
    expiration_status?: string;
    type?: string;
    number?: string;
    payment_condition_id?: string;
  }>;
}

/* ======= Payloads de requests ======= */

// ✅ sin contra_entrega_choice
export type CreatePayment = Omit<
  Payment,
  "_id" | "created_at" | "updated_at" | "document_details" | "isCharged"
> & { isCharged?: boolean };

export type UpdatePayment = Partial<CreatePayment>;
export type UpsertPayments = CreatePayment[];

export interface FindPaymentsArgs {
  page?: number;
  limit?: number;
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
  status?: string;
  customer_id?: string;
  seller_id?: string;
  sort?: string; // "field:asc|desc"
  search?: string;
  includeLookup?: boolean;
  isCharged?: "true" | "false";
  isImputed?: "true" | "false";
  type?: PaymentType; // 👈 nuevo filtro
}

export interface PaymentsListResponse {
  payments: Payment[];
  total: number;
}

/* ========= API ========= */

export const paymentsApi = createApi({
  reducerPath: "paymentsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  tagTypes: ["Payments", "Payment"],
  endpoints: (builder) => ({
    /* ---- Listado con filtros ---- */
    getPayments: builder.query<PaymentsListResponse, FindPaymentsArgs | void>({
      query: (args) => {
        const {
          page = 1,
          limit = 10,
          startDate,
          endDate,
          status,
          customer_id,
          seller_id,
          sort,
          search,
          includeLookup,
          isCharged,
          isImputed,
          type, // 👈
        } = args || {};
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          token: process.env.NEXT_PUBLIC_TOKEN || "",
        });
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (status) params.append("status", status);
        if (customer_id) params.append("customer_id", customer_id);
        if (seller_id) params.append("seller_id", seller_id);
        if (sort) params.append("sort", sort);
        if (search) params.append("search", search);
        if (includeLookup) params.append("includeLookup", String(includeLookup));
        if (isCharged) params.append("isCharged", isCharged);
        if (isImputed) params.append("isImputed", isImputed);
        if (type) params.append("type", type); // 👈

        console.log(`/payments?${params.toString()}`);
        return `/payments?${params.toString()}`;
      },
      transformResponse: (response: PaymentsListResponse | undefined) => {
        if (!response) return { payments: [], total: 0 };
        if (!response.payments?.length) return { payments: [], total: 0 };
        return response;
      },
      providesTags: (result) =>
        result?.payments
          ? [
              ...result.payments.map((p) => ({
                type: "Payment" as const,
                id: p._id,
              })),
              { type: "Payments" as const, id: "LIST" },
            ]
          : [{ type: "Payments" as const, id: "LIST" }],
    }),

    /* ---- Obtener uno ---- */
    getPaymentById: builder.query<Payment, string>({
      query: (id) =>
        `/payments/${id}?token=${process.env.NEXT_PUBLIC_TOKEN || ""}`,
      providesTags: (_res, _err, id) => [{ type: "Payment", id }],
    }),

    /* ---- Crear (uno) ---- */
    createPayment: builder.mutation<Payment, CreatePayment>({
      query: (body) => ({
        url: `/payments?token=${process.env.NEXT_PUBLIC_TOKEN || ""}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Payments", id: "LIST" }],
    }),

    /* ---- Crear (varios) ---- */
    createPayments: builder.mutation<Payment[], CreatePayment[]>({
      query: (body) => ({
        url: `/payments?token=${process.env.NEXT_PUBLIC_TOKEN || ""}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Payments", id: "LIST" }],
    }),

    /* ---- Upsert (array) ---- */
    upsertPayments: builder.mutation<Payment[], UpsertPayments>({
      query: (body) => ({
        url: `/payments/upsert?token=${process.env.NEXT_PUBLIC_TOKEN || ""}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Payments", id: "LIST" }],
    }),

    /* ---- Update uno ---- */
    updatePayment: builder.mutation<
      Payment,
      { id: string; data: UpdatePayment }
    >({
      query: ({ id, data }) => ({
        url: `/payments/${id}?token=${process.env.NEXT_PUBLIC_TOKEN || ""}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Payment", id: arg.id },
        { type: "Payments", id: "LIST" },
      ],
    }),

    /* ---- Delete (muchos) ---- */
    deletePayments: builder.mutation<{ deleted: number } | any, string[]>({
      query: (ids) => ({
        url: `/payments/delete?token=${process.env.NEXT_PUBLIC_TOKEN || ""}`,
        method: "POST", // si tu backend usa DELETE con body, cambiá aquí
        body: { ids },
      }),
      invalidatesTags: [{ type: "Payments", id: "LIST" }],
    }),

    /* ---- Marcar como cobrado ---- */
    markAsCharged: builder.mutation<
      Payment,
      { id: string; value: boolean; comments?: string }
    >({
      query: ({ id, value, comments }) => ({
        url: `/payments/${id}/charged?token=${
          process.env.NEXT_PUBLIC_TOKEN || ""
        }`,
        method: "PATCH",
        body: comments ? { value, comments } : { value },
      }),
    }),

    setCharged: builder.mutation<Payment, { id: string; value: boolean }>({
      query: ({ id, value }) => ({
        url: `/payments/${id}/charged?token=${
          process.env.NEXT_PUBLIC_TOKEN || ""
        }`,
        method: "PATCH",
        body: { value },
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Payment", id: arg.id },
        { type: "Payments", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useLazyGetPaymentsQuery,
  useGetPaymentByIdQuery,
  useCreatePaymentMutation,
  useCreatePaymentsMutation,
  useUpsertPaymentsMutation,
  useUpdatePaymentMutation,
  useDeletePaymentsMutation,
  useMarkAsChargedMutation,
  useSetChargedMutation,
} = paymentsApi;
