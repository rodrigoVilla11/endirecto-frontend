

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
      query: () => `/payment-conditions?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: PaymentCondition[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron condiciones de pago en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getPaymentConditionById: builder.query<PaymentCondition, { id: string }>({
      query: ({ id }) => `/payment-conditions/${id}`,
    }),
  }),
});

export const { useGetPaymentConditionsQuery ,useGetPaymentConditionByIdQuery } = paymentConditionsApi;
