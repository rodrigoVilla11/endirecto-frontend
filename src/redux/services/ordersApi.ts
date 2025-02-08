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
    id: string | undefined;
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
    id: string | undefined;
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
      { orders: Order[]; total: number },
      {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        customer_id?: string;
        sort?: string;
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        startDate,
        endDate,
        status,
        customer_id,
        sort = "",
      } = {}) => {
        const url = `/orders`;
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          token: process.env.NEXT_PUBLIC_TOKEN || "",
        });

        if (sort) {
          params.append("sort", sort);
        }
        if (customer_id) {
          params.append("customer_id", customer_id);
        }
        if (startDate) {
          params.append("startDate", startDate);
        }
        if (endDate) {
          params.append("endDate", endDate);
        }
        if (status) {
          params.append("status", status);
        }
        return `${url}?${params.toString()}`;
      },
      transformResponse: (response: { orders: Order[]; total: number }) => {
        if (!response || !response.orders) {
          console.error("No se recibieron pedidos en la respuesta");
          return { orders: [], total: 0 };
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
