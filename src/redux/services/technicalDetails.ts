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
      TechnicalDetail[],
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "" } = {}) =>
        `/technical-details?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: TechnicalDetail[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron clientes en la respuesta");
          return [];
        }
        return response;
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

export const { useGetTechnicalDetailsQuery, useGetTechnicalDetailByIdQuery, useCreateTechnicalDetailMutation, useGetAllTechnicalDetailQuery } =
  technicalDetailsApi;
