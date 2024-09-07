import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type User = {
    username: string;
    password: string;
    email: string;
    role: string;
    username_customer: string;
    branch: string;
    zone?: string;
};

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || 'http://localhost:3000', // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getUsers: builder.query<User[], null>({
      query: () => `/users?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: User[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron usuarios en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getUserById: builder.query<User, { id: string }>({
      query: ({ id }) => `/users/${id}`,
    }),
  }),
});

export const { useGetUsersQuery, useGetUserByIdQuery } = usersApi;
