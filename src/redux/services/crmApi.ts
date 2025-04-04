import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export enum ActionType {
  COLLECTION = "COLLECTION",
  ORDER = "ORDER",
  VISIT = "VISIT",
  EMAIL = "EMAIL",
  CALL = "CALL",
  MESSAGE = "MESSAGE",
  RECLAIM = "RECLAIM",
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
  user_id?: string;
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
  user_id?: string;
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
          return [];
        }
        return response;
      },
    }),
    getCrmPag: builder.query<
  { crms: Crm[]; total: number },
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
    seller_id?: string;
    user_id?: string;
    action?: string;
    search?: string;
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
    seller_id,
    user_id,
    action,
    search,
  } = {}) => {
    const url = `/crm`;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      token: process.env.NEXT_PUBLIC_TOKEN || "",
    });
    if (sort) params.append("sort", sort);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (status) params.append("status", status);
    if (type) params.append("type", type);
    if (insitu) params.append("insitu", insitu);
    if (customer_id) params.append("customer_id", customer_id);
    if (seller_id) params.append("seller_id", seller_id);
    if (user_id) params.append("user_id", user_id);
    if (action) params.append("action", action);
    if (search) params.append("search", search);
    
    return `${url}?${params.toString()}`;
  },
  transformResponse: (response: { crms: Crm[]; total: number }): { crms: Crm[]; total: number } => {
    if (!response || !response.crms || response.crms.length === 0) {
      return { crms: [], total: 0 };
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
    checkInsituVisit: builder.mutation<
      { insitu: boolean }, // Tipo de respuesta esperada
      { customerId: string; currentLat: number; currentLon: number } // Parámetros requeridos
    >({
      query: ({ customerId, currentLat, currentLon }) => ({
        url: `/crm/visit/${customerId}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: { currentLat, currentLon },
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
  useCheckInsituVisitMutation,
} = crmApi;
