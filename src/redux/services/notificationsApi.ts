import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export enum NotificationType {
  NOVEDAD = "NOVEDAD",
  PEDIDO = "PEDIDO",
  PRESUPUESTO = "PRESUPUESTO",
}
type Notifications = {
  _id: string;
  title: string;
  type: NotificationType;
  brand_id: string;
  schedule_from: string;
  schedule_to: string;
  description: string;
  link: string;
  read?: boolean;
  created_at?: Date;
  updated_at?: Date;
};

type CreateNotificationPayload = {
  _id?: string;
  title: string;
  type: NotificationType;
  brand_id: string;
  schedule_from: string;
  schedule_to: string;
  description: string;
  link: string;
};

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getNotifications: builder.query<Notifications[], null>({
      query: () => `/notifications?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Notifications[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron notifications en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getNotificationById: builder.query<Notifications, { id: string }>({
      query: ({ id }) =>
        `/notifications/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createNotification: builder.mutation<
      Notifications,
      CreateNotificationPayload
    >({
      query: (newNotification) => ({
        url: `/notifications?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newNotification,
      }),
    }),
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
    getNotificationsPag: builder.query<
      Notifications[],
      {
        page?: number;
        limit?: number;
        query?: string;
        type?: NotificationType;
        sort?: string 
      }
    >({
      query: ({ page = 1, limit = 10, query = "", type , sort = ""}) => {
        let url = `/notifications?page=${page}&limit=${limit}&q=${query}&sort=${sort}&token=${process.env.NEXT_PUBLIC_TOKEN}`;

        if (type) {
          url += `&type=${type}`;
        }
        return url;
      },
      transformResponse: (response: Notifications[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron notificaciones en la respuesta");
          return [];
        }
        return response;
      },
    }),

    countNotifications: builder.query<number, null>({
      query: () => {
        return `/notifications/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationByIdQuery,
  useCreateNotificationMutation,
  useDeleteNotificationMutation,
  useCountNotificationsQuery,
  useGetNotificationsPagQuery,
} = notificationsApi;
