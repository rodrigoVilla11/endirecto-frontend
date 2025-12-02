import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export enum InstanceType {
  COLLECTION_CALL = "COLLECTION CALL",
  WHATSAPP_MESSAGE = "WHATSAPP MESSAGE",
  SEND_ACCOUNT_SUMMARY = "SEND ACCOUNT SUMMARY",
  PAYMENT_CLAIM = "PAYMENT CLAIM",
}

export enum PriorityInstance {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export interface Instance {
  type: InstanceType;
  priority: PriorityInstance;
  notes: string;
}

export interface CreateCustomerNotificationDto {
  article_id?: string;
  brand_id?: string;
  description: string;
  link: string;
  schedule_from: Date;
  schedule_to: Date;
  title: string;
  type: "NOVEDAD" | "PEDIDO" | "PRESUPUESTO" | "PAGO"| "CONTACTO" ;
}

interface CustomersPagResponse {
  customers: Customer[];
  totalCustomers: number;
}

export type Customer = {
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
  notifications: any;
  price_list_id: string;
  seller_id: string;
  documents_balance: string[];
  shopping_cart: string[];
  favourites: string[];
  instance: Instance[];
  logo: string;
  password: string;
  profileImg: string;
  gps: string;
  showCostPrice: boolean;
  obs1: string;
  obs2: string;
  obs3: string;
  obs4: string;
  obs5: string;
  obs6: string;
  credit_limit: string;
  days_limit: string;
};

export type UpdateCustomersPayload = {
  id: string;
  email?: string;
  phone?: string;
  logo?: string;
  shopping_cart?: string[];
  favourites?: string[];
  instance?: Instance[];
  password?: string;
  obs1?: string;
  obs2?: string;
  obs3?: string;
  obs4?: string;
  obs5?: string;
  obs6?: string;
  gps?: string;
  profileImg?: string;
  showCostPrice?: boolean;
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
          return [];
        }
        return response;
      },
    }),

    getCustomersPag: builder.query<
      CustomersPagResponse,
      {
        page?: number;
        limit?: number;
        query?: string;
        hasDebt?: string;
        hasDebtExpired?: string;
        seller_id?: string;
        instance?: string;
        hasArticlesOnSC?: string;
        sort?: string;
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
        sort = "",
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
        if (sort) params.append("sort", sort);
        if (seller_id) params.append("seller_id", seller_id);
        if (instance) params.append("instance", instance);

        const fullUrl = `${url}?${params.toString()}`;
        return fullUrl;
      },
      transformResponse: (response: any): CustomersPagResponse => {
        return {
          customers: response.customers,
          totalCustomers: response.totalCustomers,
        };
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

    // 🔔 MASIVO por seller_id (ya existente)
    addNotificationToCustomers: builder.mutation<
      Customer[],
      { sellerId: string; notification: CreateCustomerNotificationDto }
    >({
      query: (payload) => ({
        url: `/customers/add-notification?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: payload,
      }),
    }),

    // 🔔 NUEVO: SOLO para un customer
    addNotificationToCustomer: builder.mutation<
      Customer,
      { customerId: string; notification: CreateCustomerNotificationDto }
    >({
      query: ({ customerId, notification }) => ({
        url: `/customers/${customerId}/add-notification?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: notification,
      }),
    }),

    // Marcar notificación como leída
    markNotificationAsReadCustomer: builder.mutation<
      Customer,
      { id: string; notificationId: string }
    >({
      query: ({ id, notificationId }) => ({
        url: `/customers/mark-notification-read?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PATCH",
        body: { id, notificationId },
      }),
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
  useAddNotificationToCustomersMutation,   // masivo por seller
  useAddNotificationToCustomerMutation,    // 👈 nuevo: por customer
  useMarkNotificationAsReadCustomerMutation,
} = customerApi;
