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
  seller_id?: string;
  notifications: any
};

type CreateUserPayload = {
  _id?: string;
  username: string;
  password: string;
  email: string;
  role: Roles;
  branch: string;
  seller_id?: string;
};

type UpdateUserPayload = {
  _id: string;
  username: string;
  password: string;
  email: string;
  role: Roles;
  branch: string;
};

export interface CreateUserNotificationDto {
  article_id?: string;
  brand_id?: string;
  description: string;
  link: string;
  schedule_from: Date;
  schedule_to: Date;
  title: string;
  type: "NOVEDAD" | "PEDIDO" | "PRESUPUESTO";
  customer_id?: string
}

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({
    baseUrl:
      process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getUsers: builder.query<User[], null>({
      query: () => `/users/all?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: User[]) => {
        if (!response || response.length === 0) {
          return [];
        }
        return response;
      },
    }),
    getUsersPag: builder.query<
      User[],
      { page?: number; limit?: number; query?: string; sort?: string }
    >({
      query: ({ page = 1, limit = 10, query = "", sort = "user:asc" } = {}) => {
        return `/users?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: User[]) => {
        if (!response || response.length === 0) {
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
      query: ({ id }) =>
        `/users/findOne/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
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
    addNotificationToUser: builder.mutation<
      User[],
      { userId: string; notification: CreateUserNotificationDto }
    >({
      query: (payload) => ({
        url: `/users/add-notification?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: payload,
      }),
    }),
    // Nuevo endpoint para agregar una notificación a usuarios según su role.
    addNotificationToUsersByRoles: builder.mutation<
      User[],
      { roles: Roles[]; notification: CreateUserNotificationDto }
    >({
      query: (payload) => ({
        url: `/users/add-notification-by-roles?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: payload,
      }),
    }),
    markNotificationAsRead: builder.mutation<
          User,
          { id: string; title: string }
        >({
          query: ({ id, title }) => ({
            url: `/users/mark-notification-read?token=${process.env.NEXT_PUBLIC_TOKEN}`,
            method: "PATCH",
            body: { id, title },
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
  useAddNotificationToUserMutation,
  useAddNotificationToUsersByRolesMutation,
  useMarkNotificationAsReadMutation,
} = usersApi;
