import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Customer = {
  id: string;
  name: string;
  address: string;
  locality: string;
  state: string;
  phone: string;
  email: string;
  cuit: string;
  branch_id: string;
  payment_condition_id: string;
  notifications_id: string[];
  price_list_id: string;
  seller_id: string;
};

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getCustomers: builder.query<Customer[], null>({
      query: () => `/customers/all?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Customer[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron clientes en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getCustomersPag: builder.query<
    Customer[],
      { page?: number; limit?: number; query?: string }
    >({
      query: ({ page = 1, limit = 10, query = "" } = {}) => {
        return `/customers?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: Customer[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron cllientes en la respuesta");
          return [];
        }
        return response;
      },
    }),

    countCustomers: builder.query<number, null>({
      query: () => {
        return `/customers/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    getCustomerById: builder.query<Customer, { id: string }>({
      query: ({ id }) => `/customers/${id}`,
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useGetCustomersPagQuery,
  useCountCustomersQuery,
} = customerApi;
