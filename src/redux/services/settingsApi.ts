// src/redux/services/settingsApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  tagTypes: ["Settings"],
  endpoints: (builder) => ({
    getInterestRate: builder.query<{ value: number }, void>({
      query: () => `/settings/interest-rate?token=${process.env.NEXT_PUBLIC_TOKEN || ""}`,
      providesTags: [{ type: "Settings", id: "interest-rate" }],
    }),
    updateInterestRate: builder.mutation<{ value: number }, { value: number }>({
      query: (body) => ({
        url: `/settings/interest-rate?token=${process.env.NEXT_PUBLIC_TOKEN || ""}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Settings", id: "interest-rate" }],
    }),
  }),
});

export const { useGetInterestRateQuery, useUpdateInterestRateMutation } = settingsApi;
