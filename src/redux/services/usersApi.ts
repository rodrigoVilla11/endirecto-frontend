import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export enum Roles {
  ADMINISTRADOR = "ADMINISTRADOR",
  OPERADOR = "OPERADOR",
  MARKETING = "MARKETING",
  VENDEDOR = "VENDEDOR",
}

type User = {
  _id: string;
  username: string;
  password: string;
  email: string;
  role: Roles;
  username_customer: string;
  branch: string;
  zone?: string;
};
type CreateUserPayload = {
  _id?: string;
  username: string;
  password: string;
  email: string;
  role: Roles;
  branch: string;
};
type UpdateUserPayload = {
  _id: string;
  username: string;
  password: string;
  email: string;
  role: Roles;
  branch: string;
};

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
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
    getUsersPag: builder.query<
      User[],
      { page?: number; limit?: number; query?: string }
    >({
      query: ({ page = 1, limit = 10, query = "" } = {}) => {
        return `/users?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: User[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron usuarios en la respuesta");
          return [];
        }
        return response;
      },
    }),

    countUsers: builder.query<number, null>({
      query: () => {
        return `/users/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    getUserById: builder.query<User, { id: string }>({
      query: ({ id }) => `/users/findOne/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createUser: builder.mutation<User, CreateUserPayload>({
      query: (newUser) => ({
        url: `/users/register?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newUser,
      }),
    }),

    updateUser: builder.mutation<User, UpdateUserPayload>({
      query: ({ _id, ...updatedUser }) => ({
        url: `/users/update-one/${_id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedUser,
      }),
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCountUsersQuery,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useGetUsersPagQuery,
  useCreateUserMutation,
} = usersApi;
