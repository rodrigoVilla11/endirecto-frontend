import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type CustomersBrands = {
  _id: string;
  margin: number; // MARGEN UTILIDAD
  order_by_presale: boolean; // PEDIDO PREVENTA
  order_by_presale_percentage: number; // PORCENTAJE STOCK PARA PEDIDO PREVENTA
  brand_id: string; // MARCA ID
  customer_id: string; // CLIENTE ID
};

type CreateCustomersBrandsPayload = {
  margin: number; // MARGEN UTILIDAD
  order_by_presale?: boolean; // PEDIDO PREVENTA
  order_by_presale_percentage?: number; // PORCENTAJE STOCK PARA PEDIDO PREVENTA
  brand_id: string; // MARCA ID
  customer_id: string; // CLIENTE ID
};

type UpdateCustomersBrandsPayload = {
  _id: string;
  margin?: number; // MARGEN UTILIDAD
  order_by_presale?: boolean; // PEDIDO PREVENTA
  order_by_presale_percentage?: number; // PORCENTAJE STOCK PARA PEDIDO PREVENTA
};
export const customersBrandsApi = createApi({
  reducerPath: "customersBrandsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    getCustomersBrands: builder.query<CustomersBrands[], null>({
      query: () => `/customers-brands?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: CustomersBrands[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron customers brands en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getCustomersBrandsPag: builder.query<
      CustomersBrands[],
      { page?: number; limit?: number; query?: string }
    >({
      query: ({ page = 1, limit = 10, query = "" } = {}) => {
        return `/customers-brands?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: CustomersBrands[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron customers brands en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getCustomersBrandsByCustomer: builder.query<
      CustomersBrands[],
      { customer_id: string }
    >({
      query: ({ customer_id }) =>
        `/customers-brands/customer/${customer_id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    countCustomersBrands: builder.query<number, null>({
      query: () => {
        return `/customers-brands/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    getCustomersBrandsById: builder.query<CustomersBrands, { id: string }>({
      query: ({ id }) =>
        `/customers-brands/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getCustomersBrandsByBrandAndCustomerId: builder.query<CustomersBrands, { id: string, customer: string }>({
      query: ({ id, customer }) =>
        `/customers-brands/brand/${id}/${customer}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    createCustomersBrands: builder.mutation<
      CustomersBrands,
      CreateCustomersBrandsPayload
    >({
      query: (newCustomersBrands) => ({
        url: `/customers-brands?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "POST",
        body: newCustomersBrands,
      }),
    }),
    updateCustomersBrands: builder.mutation<
      CustomersBrands,
      UpdateCustomersBrandsPayload
    >({
      query: ({ _id, ...updatedCustomersBrands }) => ({
        url: `/customers-brands/${_id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedCustomersBrands, // Directamente los datos de actualización
      }),
    }),

    deleteCustomersBrands: builder.mutation<void, string>({
      query: (id) => ({
        url: `/customers-brands/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
    updateMassiveCustomersBrands: builder.mutation<
      { matchedCount: number; modifiedCount: number }, // Respuesta del servidor
      { customer_id: string; margin: number } // Parámetros de entrada
    >({
      query: ({ customer_id, margin }) => ({
        url: `/customers-brands/update-massive?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PATCH",
        body: { customer_id, margin },
      }),
    }),
  }),
});

export const {
  useGetCustomersBrandsQuery,
  useGetCustomersBrandsByIdQuery,
  useGetCustomersBrandsPagQuery,
  useCountCustomersBrandsQuery,
  useUpdateCustomersBrandsMutation,
  useDeleteCustomersBrandsMutation,
  useGetCustomersBrandsByCustomerQuery,
  useCreateCustomersBrandsMutation,
  useUpdateMassiveCustomersBrandsMutation,
  useGetCustomersBrandsByBrandAndCustomerIdQuery
} = customersBrandsApi;
