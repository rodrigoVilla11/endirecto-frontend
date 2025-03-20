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

interface Orders {
  orders: Order[],
  total: number
}
interface Order {
  _id: string;
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
  multisoft_id?: string;
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
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], null>({
      query: () => `/orders/all?token=${process.env.NEXT_PUBLIC_TOKEN}`,
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
    seller_id?: string;
    sort?: string;
    search?: string; // nuevo parámetro
  }
>({
  query: ({
    page = 1,
    limit = 10,
    startDate,
    endDate,
    status,
    customer_id,
    seller_id,
    sort = "",
    search,
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
    if (seller_id) {
      params.append("seller_id", seller_id);
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
    if (search) {
      params.append("search", search);
    }
    return `${url}?${params.toString()}`;
  },
  transformResponse: (response: Orders) => {
    if (!response || !response.orders) {
      console.error("No se recibieron pedidos en la respuesta");
      return { orders: [], total: 0 };
    }
    return response;
  },
}),

    countOrder: builder.query<number, null>({
      query: () => `/orders/count?token=${process.env.NEXT_PUBLIC_TOKEN}`,
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
    // Nuevo endpoint para obtener la suma de ventas mensuales con filtros
    getMonthlySales: builder.query<
      any[],
      {
        startDate?: string;
        endDate?: string;
        brand?: string;
        item?: string;
      }
    >({
      query: ({ startDate, endDate, brand, item }) => {
        const params = new URLSearchParams({
          token: process.env.NEXT_PUBLIC_TOKEN || "",
        });
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (brand) params.append("brand", brand);
        if (item) params.append("item", item);
        return `/orders/monthly-sales?${params.toString()}`;
      },
      transformResponse: (response: any[]) => response,
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
  useGetMonthlySalesQuery,
} = ordersApi;
