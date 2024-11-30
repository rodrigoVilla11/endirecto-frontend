import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Branch = {
  id: string; // ID
  name: string; // Nombre
  address: string; // Dirección
  postal_code: string; // Código postal
  phone: string; // Teléfono
  whatsapp?: string; // WhatsApp
  gps?: string; // GPS
  schedule?: string; // Horarios
  mail_budgets?: string; // Mail para presupuestos
  mail_collections?: string; // Mail para pagos
  mail_collections_summaries?: string; // Mail para rendiciones de pagos
  mail_contacts?: string; // Mail para contactos
  mail_orders?: string; // Mail para pedidos
  mail_pendings?: string; // Mail para anulación de pendientes
  mail_profile?: string; // Mail para cambios en perfil de clientes
  mail_system?: string; // Mail para sistemas
  exchange_money?: string; // Moneda de cambio
  exchange_rate?: number; // Tipo de cambio
  deleted_at: Date; // Fecha de eliminación
};

export const branchesApi = createApi({
  reducerPath: "branchesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getBranches: builder.query<Branch[], null>({
      query: () => `/branches?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Branch[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron sucursales en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getBranchById: builder.query<Branch, { id: string }>({
      query: ({ id }) =>
        `/branches/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
    }),
    getBranchPag: builder.query<
      Branch[],
      { page?: number; limit?: number; query?: string }
    >({
      query: ({ page = 1, limit = 10, query = "" } = {}) => {
        return `/branches?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: Branch[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron sucursales en la respuesta");
          return [];
        }
        return response;
      },
    }),
    countBranch: builder.query<number, null>({
      query: () => {
        return `/branches/count?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useGetBranchByIdQuery,
  useCountBranchQuery,
  useGetBranchPagQuery,
} = branchesApi;
