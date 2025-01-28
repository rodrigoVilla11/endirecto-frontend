import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export enum InstanceType {
  COLLECTION_CALL = "COLLECTION CALL",
  WHATSAPP_MESSAGE = "WHATSAPP MESSAGE",
  SEND_ACCOUNT_SUMMARY = "SEND ACCOUNT SUMMARY",
  PAYMENT_CLAIM = "PAYMENT CLAIM",
}

export interface Instance {
  type: InstanceType;
  priority: PriorityInstance;
  notes: string;
}

export enum PriorityInstance {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

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
  documents_balance: string[];
  shopping_cart: string[];
  favourites: string[];
  instance: Instance[];
  logo: string;
  password: string;
  profileImg: string;
};

type UpdateCustomersPayload = {
  id: string;
  email?: string;
  phone?: string;
  logo?: string;
  shopping_cart?: string[];
  favourites?: string[];
  instance?: Instance[];
  password?: string;
  profileImg?: string;
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
      {
        page?: number;
        limit?: number;
        query?: string;
        hasDebt?: string;
        hasDebtExpired?: string;
        seller_id?: string;
        instance?: string;
        hasArticlesOnSC?: string;
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        query = "",
        hasDebt = "",
        hasDebtExpired = "",
        seller_id = "",
        instance = "",
        hasArticlesOnSC = "",
      } = {}) => {
        const url = `/customers`;
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          token: process.env.NEXT_PUBLIC_TOKEN || "",
        });

        if (query) params.append("q", query);
        if (hasDebt) params.append("hasDebt", hasDebt);
        if (hasDebtExpired) params.append("hasDebtExpired", hasDebtExpired);
        if (hasArticlesOnSC) params.append("hasArticlesOnSC", hasArticlesOnSC);

        if (seller_id) params.append("seller_id", seller_id);
        if (instance) params.append("instance", instance);

        const fullUrl = `${url}?${params.toString()}`;
        return fullUrl;
      },
      transformResponse: (response: Customer[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron cllientes en la respuesta");
          return [];
        }
        return response;
      },
    }),

    updateCustomer: builder.mutation<Customer, UpdateCustomersPayload>({
      query: ({ id, ...updatedCustomer }) => ({
        url: `/customers/update-one/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedCustomer,
      }),
    }),
    countCustomers: builder.query<number, { seller_id?: string }>({
      query: ({ seller_id = "" }) => {
        let url = `/customers/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;

        if (seller_id) {
          url += `&sellerId=${seller_id}`;
        }
        return url;
      },
    }),
    getCustomerById: builder.query<Customer, { id: string }>({
      query: ({ id }) =>
        `/customers/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useGetCustomersPagQuery,
  useCountCustomersQuery,
  useUpdateCustomerMutation,
  useLazyGetCustomersPagQuery,
} = customerApi;
