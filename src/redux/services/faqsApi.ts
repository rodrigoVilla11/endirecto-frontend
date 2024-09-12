import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Faqs = {
  _id: string;
  question: string;
  answer: string;
};

type CreateFaqsPayload = {
  question: string;
  answer: string;
};

type UpdateFaqsPayload = {
  _id: string;
  question?: string;
  answer?: string;
};
export const faqsApi = createApi({
  reducerPath: "faqsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getFaqs: builder.query<Faqs[], null>({
      query: () => `/faqs?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Faqs[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron faqs en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getFaqById: builder.query<Faqs, { id: string }>({
      query: ({ id }) => `/faqs/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createFaq: builder.mutation<Faqs, CreateFaqsPayload>({
      query: (newFaq) => ({
        url: `/faqs?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newFaq,
      }),
    }),
    updateFaq: builder.mutation<Faqs, UpdateFaqsPayload>({
      query: ({ _id, ...updatedFaq }) => ({
        url: `/faqs/${_id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedFaq,
      }),
    }),
    deleteFaq: builder.mutation<void, string>({
      query: (id) => ({
        url: `/faqs/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const { useGetFaqsQuery, useGetFaqByIdQuery, useCreateFaqMutation, useUpdateFaqMutation, useDeleteFaqMutation } =
  faqsApi;
