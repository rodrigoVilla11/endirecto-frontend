import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Reclaims = {
  _id: string;
  status: "PENDING" | "ANSWERED";
  date: string;
  document_type_number?: string;
  description: string;
  files?: string;
  date_solved?: string;
  cause?: string;
  public_solution?: string;
  internal_solution?: string;
  valid: "S" | "N";
  article_id: string;
  b2c_store_id?: string;
  branch_id: string;
  customer_id: string;
  document_id?: string;
  reclaims_type_id: string;
  seller_id?: string;
  user_id?: string;
  user_solved_id?: string;
  deleted_at?: string;
};
export enum Status {
  PENDING = "PENDING",
  ANSWERED = "ANSWERED",
}
export enum Valid {
  S = "S",
  N = "N",
}
type CreateReclaimsPayload = {
  status: Status;
  date: string;
  document_type_number?: string;
  description: string;
  files?: string;
  date_solved?: string;
  cause?: string;
  public_solution?: string;
  internal_solution?: string;
  valid: Valid;
  article_id: string;
  b2c_store_id?: string;
  branch_id: string;
  customer_id: string;
  document_id?: string;
  reclaims_type_id: string;
  seller_id?: string;
  user_id?: string;
  user_solved_id?: string;
  deleted_at?: string;
};

type UpdateReclaimsPayload = {
  _id: string;
  status: "PENDING" | "ANSWERED";
  date: string;
  document_type_number?: string;
  description: string;
  files?: string;
  date_solved?: string;
  cause?: string;
  public_solution?: string;
  internal_solution?: string;
  valid: "S" | "N";
  article_id: string;
  b2c_store_id?: string;
  branch_id: string;
  customer_id: string;
  document_id?: string;
  reclaims_type_id: string;
  seller_id?: string;
  user_id?: string;
  user_solved_id?: string;
  deleted_at?: string;
};

export const reclaimsApi = createApi({
  reducerPath: "reclaimsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getReclaims: builder.query<Reclaims[], null>({
      query: () => `/reclaims?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Reclaims[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron reclamos en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getReclaimsPag: builder.query<
      Reclaims[],
      {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        query?: string;
        document_type_number?: string;
        valid?: string;
        status?: string;
        customer_id?: string;
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        startDate,
        endDate,
        query,
        document_type_number,
        status,
        valid,
        customer_id,
      } = {}) => {
        const url = `/reclaims`;
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          token: process.env.NEXT_PUBLIC_TOKEN || "",
        });

        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (status) params.append("status", status);
        if (document_type_number)
          params.append("document_type_number", document_type_number);
        if (query) params.append("q", query);
        if (valid) params.append("valid", valid);
        if (customer_id) params.append("customer_id", customer_id);

        const fullUrl = `${url}?${params.toString()}`;
        return fullUrl;
      },
      transformResponse: (response: Reclaims[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron reclamos en la respuesta");
          return [];
        }
        return response;
      },
    }),
    countReclaims: builder.query<number, null>({
      query: () => {
        return `/reclaims/count-all?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    getReclaimById: builder.query<Reclaims, { id: string }>({
      query: ({ id }) =>
        `/reclaims/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createReclaim: builder.mutation<Reclaims, CreateReclaimsPayload>({
      query: (newReclaims) => ({
        url: `/reclaims?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newReclaims,
      }),
    }),
    updateReclaim: builder.mutation<Reclaims, UpdateReclaimsPayload>({
      query: ({ _id, ...updatedReclaims }) => ({
        url: `/reclaims/${_id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedReclaims,
      }),
    }),
    deleteReclaim: builder.mutation<void, string>({
      query: (id) => ({
        url: `/reclaims/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetReclaimsQuery,
  useGetReclaimByIdQuery,
  useCountReclaimsQuery,
  useCreateReclaimMutation,
  useDeleteReclaimMutation,
  useGetReclaimsPagQuery,
  useUpdateReclaimMutation,
} = reclaimsApi;
