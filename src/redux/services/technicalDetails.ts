import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type TechnicalDetail = {
  id: string; // ID
  name: string; // Nombre
};

type CreateTechnicalDetailPayload = {
  id: string; // ID
  name: string; // Nombre
};

export const technicalDetailsApi = createApi({
  reducerPath: "technicalDetailsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getTechnicalDetails: builder.query<
      { technicalDetails: TechnicalDetail[]; total: number },
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) =>
        `/technical-details?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (
        response: any
      ): { technicalDetails: TechnicalDetail[]; total: number } => {
        if (!response || !response.technicalDetails) {
          console.error("No se recibieron technical details en la respuesta");
          return { technicalDetails: [], total: 0 };
        }
        return {
          technicalDetails: response.technicalDetails,
          total: response.total,
        };
      },
    }),

    getAllTechnicalDetail: builder.query<TechnicalDetail[], null>({
      query: () =>
        `/technical-details/all?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getTechnicalDetailById: builder.query<TechnicalDetail, { id: string }>({
      query: ({ id }) =>
        `/technical-details/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createTechnicalDetail: builder.mutation<
      TechnicalDetail,
      CreateTechnicalDetailPayload
    >({
      query: (newTechnicalDetail) => ({
        url: `/technical-details?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newTechnicalDetail,
      }),
    }),
  }),
});

export const {
  useGetTechnicalDetailsQuery,
  useGetTechnicalDetailByIdQuery,
  useCreateTechnicalDetailMutation,
  useGetAllTechnicalDetailQuery,
} = technicalDetailsApi;
