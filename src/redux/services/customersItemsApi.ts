import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type CustomersItems = {
  _id: string;
  margin: number; // MARGEN UTILIDAD
  customer_id: string; // CLIENTE ID
  item_id: string; // RUBRO ID
};

type CreateCustomerItemsPayload = {
  margin: number; // MARGEN UTILIDAD
  customer_id: string; // CLIENTE ID
  item_id: string; // RUBRO ID
};

type UpdateCustomersItemsPayload = {
  _id: string;
  margin: number; // MARGEN UTILIDAD
};

export const customersItemsApi = createApi({
  reducerPath: "customersItemsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getCustomersItems: builder.query<CustomersItems[], null>({
      query: () => `/customers-items?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: CustomersItems[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron customers items en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getCustomersItemsPag: builder.query<
      CustomersItems[],
      { page?: number; limit?: number; query?: string }
    >({
      query: ({ page = 1, limit = 10, query = "" } = {}) => {
        return `/customers-items?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: CustomersItems[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron customers items en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getCustomersItemsByCustomer: builder.query<
      CustomersItems[],
      { customer_id: string }
    >({
      query: ({ customer_id }) =>
        `/customers-items/customer/${customer_id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    countCustomersItems: builder.query<number, null>({
      query: () => {
        return `/customers-items/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    getCustomersItemsById: builder.query<CustomersItems, { id: string }>({
      query: ({ id }) =>
        `/customers-items/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getCustomersItemsByItemAndCustomerId: builder.query<CustomersItems, { id: string, customer: string }>({
      query: ({ id, customer }) =>
        `/customers-items/item/${id}/${customer}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createCustomersItems: builder.mutation<
      CustomersItems,
      CreateCustomerItemsPayload
    >({
      query: (newCustomersItems) => ({
        url: `/customers-items?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newCustomersItems,
      }),
    }),
    updateCustomersItems: builder.mutation<
      CustomersItems,
      UpdateCustomersItemsPayload
    >({
      query: ({ _id, ...updatedCustomersItems }) => ({
        url: `/customers-items/${_id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedCustomersItems, // Directamente los datos de actualización
      }),
    }),

    deleteCustomersItems: builder.mutation<void, string>({
      query: (id) => ({
        url: `/customers-items/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
    updateMassiveCustomersItems: builder.mutation<
      { matchedCount: number; modifiedCount: number }, // Respuesta del servidor
      { customer_id: string; margin: number } // Parámetros de entrada
    >({
      query: ({ customer_id, margin }) => ({
        url: `/customers-items/update-massive?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PATCH",
        body: { customer_id, margin },
      }),
    }),
  }),
});

export const {
  useGetCustomersItemsQuery,
  useGetCustomersItemsByIdQuery,
  useGetCustomersItemsPagQuery,
  useCountCustomersItemsQuery,
  useUpdateCustomersItemsMutation,
  useDeleteCustomersItemsMutation,
  useGetCustomersItemsByCustomerQuery,
  useCreateCustomersItemsMutation,
  useUpdateMassiveCustomersItemsMutation,
  useGetCustomersItemsByItemAndCustomerIdQuery
} = customersItemsApi;
