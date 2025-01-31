

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type PaymentCondition = {
    id: string;
    name: string;
    percentage: string; // Usamos string si los valores de porcentaje se representarán así, de lo contrario, usa 'number'.
    default: 'Y' | 'N'; // Se asume que este campo solo puede tener valores 'Y' o 'N'.
};

export const paymentConditionsApi = createApi({
  reducerPath: "paymentConditionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || 'http://localhost:3000', // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getPaymentConditions: builder.query<PaymentCondition[], null>({
      query: () => `/payment-conditions/all?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: PaymentCondition[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron condiciones de pago en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getPaymentConditionsPag: builder.query<PaymentCondition[], { page?: number; limit?: number, query?: string; sort?: string }>({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) => {
        return `/payment-conditions?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: PaymentCondition[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron condiciones de pago en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getPaymentConditionById: builder.query<PaymentCondition, { id: string }>({
      query: ({ id }) => `/payment-conditions/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    countPaymentConditions: builder.query<number, null>({
      query: () => {
        return `/payment-conditions/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
  }),
});

export const { useGetPaymentConditionsQuery ,useGetPaymentConditionByIdQuery, useCountPaymentConditionsQuery, useGetPaymentConditionsPagQuery } = paymentConditionsApi;
