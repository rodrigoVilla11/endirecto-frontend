// src/redux/services/settingsApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  tagTypes: ["Settings"],
  endpoints: (builder) => ({
    // ======== Interest rate ========
    getInterestRate: builder.query<{ value: number }, void>({
      query: () =>
        `/settings/interest-rate?token=${process.env.NEXT_PUBLIC_TOKEN || ""}`,
      providesTags: [{ type: "Settings", id: "interest-rate" }],
    }),
    updateInterestRate: builder.mutation<{ value: number }, { value: number }>({
      query: (body) => ({
        url: `/settings/interest-rate?token=${
          process.env.NEXT_PUBLIC_TOKEN || ""
        }`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Settings", id: "interest-rate" }],
    }),

    // ======== Documents Grace Days ========
    getDocumentsGraceDays: builder.query<{ value: number }, void>({
      query: () =>
        `/settings/documents-grace-days?token=${
          process.env.NEXT_PUBLIC_TOKEN || ""
        }`,
      providesTags: [{ type: "Settings", id: "documents-grace-days" }],
    }),
    updateDocumentsGraceDays: builder.mutation<
      { value: number },
      { value: number }
    >({
      query: (body) => ({
        url: `/settings/documents-grace-days?token=${
          process.env.NEXT_PUBLIC_TOKEN || ""
        }`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Settings", id: "documents-grace-days" }],
    }),

    // ======== Cheque Grace Days ========
    getChequeGraceDays: builder.query<{ value: number }, void>({
      query: () =>
        `/settings/cheque-grace-days?token=${
          process.env.NEXT_PUBLIC_TOKEN || ""
        }`,
      providesTags: [{ type: "Settings", id: "cheque-grace-days" }],
    }),
    updateChequeGraceDays: builder.mutation<{ value: number }, { value: number }>(
      {
        query: (body) => ({
          url: `/settings/cheque-grace-days?token=${
            process.env.NEXT_PUBLIC_TOKEN || ""
          }`,
          method: "PATCH",
          body,
        }),
        invalidatesTags: [{ type: "Settings", id: "cheque-grace-days" }],
      }
    ),

    // ======== Calculator Cheque Grace Days ========
    getCalculatorChequeGraceDays: builder.query<{ value: number }, void>({
      query: () =>
        `/settings/calculator-cheque-grace-days?token=${
          process.env.NEXT_PUBLIC_TOKEN || ""
        }`,
      providesTags: [{ type: "Settings", id: "calculator-cheque-grace-days" }],
    }),
    updateCalculatorChequeGraceDays: builder.mutation<
      { value: number },
      { value: number }
    >({
      query: (body) => ({
        url: `/settings/calculator-cheque-grace-days?token=${
          process.env.NEXT_PUBLIC_TOKEN || ""
        }`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        { type: "Settings", id: "calculator-cheque-grace-days" },
      ],
    }),
  }),
});

export const {
  useGetInterestRateQuery,
  useUpdateInterestRateMutation,
  useGetDocumentsGraceDaysQuery,
  useUpdateDocumentsGraceDaysMutation,
  useGetChequeGraceDaysQuery,
  useUpdateChequeGraceDaysMutation,
  useGetCalculatorChequeGraceDaysQuery,
  useUpdateCalculatorChequeGraceDaysMutation,
} = settingsApi;
