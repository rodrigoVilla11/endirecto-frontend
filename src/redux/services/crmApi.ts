import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export enum ActionType {
  COLLECTION = "COLLECTION",
  ORDER = "ORDER",
  VISIT = "VISIT",
  EMAIL = "EMAIL",
  CALL = "CALL",
  MESSAGE = "MESSAGE",
}

export enum StatusType {
  PENDING = "PENDING",
  SENDED = "SENDED",
  AUTHORIZED = "AUTHORIZED",
  CHARGED = "CHARGED",
  CANCELED = "CANCELED",
}

type Crm = {
  _id: string;
  date: string;
  type: ActionType;
  gps?: string;
  insitu?: boolean;
  status: StatusType;
  notes: string;
  collection_id?: string;
  customer_id?: string;
  order_id?: string;
  seller_id?: string;
  deleted_at: string;
};

type CreateCrmPayload = {
  date: string;
  type: ActionType;
  gps?: string;
  insitu?: boolean;
  status: StatusType;
  notes: string;
  collection_id?: string;
  customer_id?: string;
  order_id?: string;
  seller_id?: string;
  deleted_at?: string;
};

type UpdateCrmPayload = {
  _id: string;
  date: string;
  type: ActionType;
  gps?: string;
  insitu?: boolean;
  status: StatusType;
  notes: string;
  collection_id?: string;
  customer_id?: string;
  order_id?: string;
  seller_id?: string;
  deleted_at: string;
};
export const crmApi = createApi({
  reducerPath: "crmApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getCrm: builder.query<Crm[], null>({
      query: () => `/crm?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Crm[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron crm en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getCrmPag: builder.query<
      Crm[],
      {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        type?: string;
        insitu?: string;
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
        type,
        insitu,
        customer_id,
        sort = "",
      } = {}) => {
        const url = `/crm`;
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          token: process.env.NEXT_PUBLIC_TOKEN || "",
        });
        if (sort) {
          params.append("sort", sort);
        }
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (status) params.append("status", status);
        if (type) params.append("type", type);
        if (insitu) params.append("insitu", insitu);
        if (customer_id) params.append("customer_id", customer_id);

        const fullUrl = `${url}?${params.toString()}`;
        return fullUrl;
      },
      transformResponse: (response: Crm[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron rubros en la respuesta");
          return [];
        }
        return response;
      },
    }),
    countCrm: builder.query<number, null>({
      query: () => {
        return `/crm/count-all?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    getCrmById: builder.query<Crm, { id: string }>({
      query: ({ id }) => `/crm/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createCrm: builder.mutation<Crm, CreateCrmPayload>({
      query: (newCrm) => ({
        url: `/crm?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newCrm,
      }),
    }),
    updateCrm: builder.mutation<Crm, UpdateCrmPayload>({
      query: ({ _id, ...updatedCrm }) => ({
        url: `/crm/${_id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedCrm,
      }),
    }),
    deleteCrm: builder.mutation<void, string>({
      query: (id) => ({
        url: `/crm/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetCrmQuery,
  useGetCrmByIdQuery,
  useGetCrmPagQuery,
  useCountCrmQuery,
  useCreateCrmMutation,
  useDeleteCrmMutation,
  useUpdateCrmMutation,
} = crmApi;
