import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export enum NotificationType {
  NOVEDAD = "NOVEDAD",
  PEDIDO = "PEDIDO",
  PRESUPUESTO = "PRESUPUESTO",
}

export type Notifications = {
  _id: string;
  title: string;
  type: NotificationType;
  brand_id: string;
  article_id: string;
  description: string;
  link: string;
  created_at?: Date;
  updated_at?: Date;
};

export type CreateNotificationPayload = {
  title: string;
  type: NotificationType;
  brand_id: string;
  article_id: string;
  description: string;
  link: string;
  created_at?: Date;
  updated_at?: Date;
};

export type AllNotifications = {
  notifications: Notifications[];
  total: number;
};

export type UpdateNotificationPayload = Partial<CreateNotificationPayload> & {
  title: string;
  type: NotificationType;
  brand_id: string;
  article_id: string;
  description: string;
  link: string;
};

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    // Obtener todas las notificaciones sin paginación
    getNotifications: builder.query<AllNotifications, null>({
      query: () => `/notifications?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: AllNotifications) => {
        if (!response || !response.notifications || response.notifications.length === 0) {
          return { notifications: [], total: 0 };
        }
        return response;
      },
    }),
    // Obtener una notificación por ID
    getNotificationById: builder.query<Notifications, { id: string }>({
      query: ({ id }) =>
        `/notifications/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    // Crear una notificación
    createNotification: builder.mutation<Notifications, CreateNotificationPayload>({
      query: (newNotification) => ({
        url: `/notifications?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newNotification,
      }),
    }),
    // Actualizar una notificación
    updateNotification: builder.mutation<
      Notifications,
      { id: string; body: UpdateNotificationPayload }
    >({
      query: ({ id, body }) => ({
        url: `/notifications/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PATCH",
        body,
      }),
    }),
    // Eliminar una notificación
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
    // Obtener notificaciones paginadas con filtros (general)
    getNotificationsPag: builder.query<
      { notifications: Notifications[]; total: number },
      {
        page?: number;
        limit?: number;
        query?: string;
        type?: NotificationType;
        sort?: string;
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        query = "",
        type,
        sort = "",
      }) => {
        let url = `/notifications?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
        if (type) {
          url += `&type=${type}`;
        }
        return url;
      },
      transformResponse: (response: any): { notifications: Notifications[]; total: number } => {
        if (!response || !response.notifications || response.notifications.length === 0) {
          return { notifications: [], total: 0 };
        }
        return {
          notifications: response.notifications,
          total: response.total,
        };
      },
    }),
    // Obtener notificaciones por customer_id
    getNotificationsByCustomerId: builder.query<
      { notifications: Notifications[]; total: number },
      {
        customer_id: string;
        page?: number;
        limit?: number;
        query?: string;
        type?: NotificationType;
        sort?: string;
      }
    >({
      query: ({ customer_id, page = 1, limit = 10, query = "", type, sort = "" }) => {
        let url = `/notifications/by-customer?customer_id=${customer_id}&page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
        if (type) {
          url += `&type=${type}`;
        }
        return url;
      },
      transformResponse: (response: any): { notifications: Notifications[]; total: number } => {
        if (!response || !response.notifications || response.notifications.length === 0) {
          return { notifications: [], total: 0 };
        }
        return {
          notifications: response.notifications,
          total: response.total,
        };
      },
    }),
    // Contar todas las notificaciones (opcional)
    countNotifications: builder.query<number, null>({
      query: () =>
        `/notifications/count?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
  }),
});

// Hooks generados para usar en componentes
export const {
  useGetNotificationsQuery,
  useGetNotificationByIdQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useDeleteNotificationMutation,
  useCountNotificationsQuery,
  useGetNotificationsPagQuery,
  useGetNotificationsByCustomerIdQuery,
} = notificationsApi;
