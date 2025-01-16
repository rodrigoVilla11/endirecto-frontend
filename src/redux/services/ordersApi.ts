import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface OrderDetails {
  quantity: number;
  article: {
    id: string;
  };
  percentage_1: number;
  netprice: number;
  total: number;
  branch: {
    id: string;
  };
  id: string;
}

interface Order {
  status: string;
  customer: {
    id: string | null;
  };
  seller: {
    id: string | undefined;
  };
  payment_condition: {
    id: string | undefined;
    percentage: string | undefined;
  };
  transport: {
    id: string;
  };
  tmp_id: string;
  total: number;
  notes: string;
  date: string;
  created_at: string;
  details: OrderDetails[];
}

type CreateOrderPayload = {
  status: string;
  customer: {
    id: string | null;
  };
  seller: {
    id: string | undefined;
  };
  payment_condition: {
    id: string | undefined;
    percentage: string | undefined;
  };
  transport: {
    id: string;
  };
  tmp_id: string;
  total: number;
  notes: string;
  date: string;
  created_at: string;
  details: OrderDetails[];
};

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], null>({
      query: () => `/orders?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Order[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron order en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getOrdersPag: builder.query<
      Order[],
      { page?: number; limit?: number; query?: string }
    >({
      query: ({ page = 1, limit = 10, query = "" } = {}) => {
        return `/orders?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: Order[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron ordenes en la respuesta");
          return [];
        }
        return response;
      },
    }),

    countOrder: builder.query<number, null>({
      query: () => {
        return `/orders/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    getOrderById: builder.query<Order, { id: string }>({
      query: ({ id }) => `/orders/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createOrder: builder.mutation<Order, CreateOrderPayload>({
      query: (newOrder) => ({
        url: `/orders?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newOrder,
      }),
    }),
    deleteOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/orders/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
    useCountOrderQuery,
    useCreateOrderMutation,
    useDeleteOrderMutation,
    useGetOrderByIdQuery,
    useGetOrdersPagQuery,
    useGetOrdersQuery,
} = ordersApi;
