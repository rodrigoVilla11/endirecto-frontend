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
          return [];
        }
        return response;
      },
    }),
    getFaqsPag: builder.query<
      { faqs: Faqs[]; total: number },
      { page?: number; limit?: number; query?: string }
    >({
      query: ({ page = 1, limit = 10, query = "" } = {}) => {
        return `/faqs?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (
        response: Faqs[] | { faqs: Faqs[]; total: number }
      ): { faqs: Faqs[]; total: number } => {
        // Si la respuesta es un arreglo, se asume que total es la longitud del mismo
        if (Array.isArray(response)) {
          if (!response || response.length === 0) {
            console.error(
              "No se recibieron preguntas frecuentes en la respuesta"
            );
            return { faqs: [], total: 0 };
          }
          return { faqs: response, total: response.length };
        }
        // Si la respuesta ya viene envuelta en un objeto con 'faqs' y 'total', se retorna tal cual
        if (!response.faqs || response.faqs.length === 0) {
          console.error(
            "No se recibieron preguntas frecuentes en la respuesta"
          );
          return { faqs: [], total: 0 };
        }
        return response;
      },
    }),

    countFaqs: builder.query<number, null>({
      query: () => {
        return `/faqs/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
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

export const {
  useGetFaqsQuery,
  useGetFaqByIdQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useCountFaqsQuery,
  useGetFaqsPagQuery,
} = faqsApi;
