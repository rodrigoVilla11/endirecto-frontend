import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Marketing = {
    _id: string,
    popups: PopUps,
    headers: Headers
};

export type PopUps = {
  name: string;
  sequence: number;
  location: string;
  enable: boolean;
  web: string;
  url: string;
  visualization: number;
};

export type Headers = {
  name: string;
  sequence: number;
  enable: boolean;
  homeWeb: string;
  headerWeb: string;
  url: string;
};

type CreateMarketingPayload = {
    popups?: PopUps,
    headers?: Headers
};

type UpdateMarketingPayload = {
  _id: string;
  popups?: PopUps,
  headers?: Headers
};

export const marketingApi = createApi({
  reducerPath: "marketingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getMarketingByFilter: builder.query<
      Marketing[],
      { filterBy?: string; page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10, filterBy } = {}) => {
        return `/marketing/filter?filterBy=${filterBy}&page=${page}&limit=${limit}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: Marketing[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron datos de marketing en la respuesta");
          return [];
        }
        return response;
      },
    }),

    getMarketingById: builder.query<Marketing, { id: string }>({
      query: ({ id }) => `/marketing/findOne/${id}`,
    }),
    countMarketing: builder.query<number, null>({
      query: () => {
        return `/marketing/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    createMarketing: builder.mutation<Marketing, CreateMarketingPayload>({
      query: (newMarketing) => ({
        url: `/marketing?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newMarketing,
      }),
    }),
    updateMarketing: builder.mutation<Marketing, UpdateMarketingPayload>({
      query: ({ _id, ...updatedMarketing }) => ({
        url: `/marketing/${_id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedMarketing,
      }),
    }),
    deleteMarketing: builder.mutation<void, string>({
      query: (id) => ({
        url: `/marketing/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetMarketingByFilterQuery,
  useGetMarketingByIdQuery,
  useCountMarketingQuery,
  useCreateMarketingMutation,
  useDeleteMarketingMutation,
  useUpdateMarketingMutation,
} = marketingApi;
