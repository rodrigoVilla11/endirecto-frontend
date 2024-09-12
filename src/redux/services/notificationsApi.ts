import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export enum NotificationType {
  NOVEDAD = "novedad",
  PEDIDO = "pedido",
  PRESUPUESTO = "presupuesto"
}
type Notifications= {
  _id?: string;
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
      query: ({ id }) => `/notifications/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
  }),
});

export const { useGetNotificationsQuery, useGetNotificationByIdQuery } = notificationsApi;
