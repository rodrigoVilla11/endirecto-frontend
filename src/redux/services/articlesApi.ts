import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Article = {
  id: string;
  name: string; // DESCRIPCION CORTA
  description: string; // DESCRIPCION LARGA
  description_alt?: string; // DESCRIPCION ALTERNATIVA XRA SELECCION
  supplier_code: string; // CODIGO DE PROVEEDOR
  barcode?: string; // CODIGO DE BARRA
  images?: string[]; // URL DE IMAGENES (SEPARADOS POR ;)
  images_status?: "DOWNLOADED" | "PENDING"; // ESTADO DE DESCARGA
  pdfs?: string; // URL DE PDFS (SEPARADOS POR ;)
  iva?: number; // PORCENTAJE IVA
  module?: number; // MULTIPLO
  container_content?: number; // UNIDADES ENVASADAS
  width?: number; // ANCHO
  height?: number; // ALTO
  depth?: number; // PROFUNDIDAD
  volume?: number; // VOLUMEN (ANCHO X ALTO X PROFUNDIDAD)
  weight?: number; // PESO
  conversion_unit?: number; // UNIDAD DE CONVERSION
  registration?: string; // FECHA DE ALTA
  group_article_discount?: string; // CODIGO DE GRUPO DE DESCUENTO
  tag?: "COMBO" | "HIGHLIGHTED" | "NEW" | "OFFER" | "OUTLET"; // ETIQUETA
  order_by_import?: boolean; // PEDIDO X IMPORTACION
  order_by_plane?: boolean; // PEDIDO X AVION
  order_by_plane_fee?: number; // TARIFA PEDIDO AEREO
  class?: string; // CLASE
  provider_id?: string; // PROVEEDOR ID
  provider_name?: string; // NOMBRE PROVEEDOR
  keywords?: string; // PALABAS CLAVES PARA BÚSQUEDA
  hidden?: boolean; // OCULTO
  sequence_relevance?: number; // ORDEN X RELEVANCIA
  sequence_alphabetic?: number; // ORDEN ALFABETICO X CODIGO PROVEEDOR
  sequence_minor_price?: number; // ORDEN X MENOR PRECIO
  sequence_major_price?: number; // ORDEN X MAYOR PRECIO
  sequence_alphabetic_brand?: number; // ORDEN ALFABETICO X MARCA
  sequence_registration?: number; // ORDEN FECHA DE ALTA
  sequence_quantity_next_date?: number; // ORDEN FECHA DE INGRESO
  sequence_stock?: number; // ORDEN STOCK
  articles_group_id?: string; // ARTICULO GRUPO ID
  brand_id: string; // MARCA ID
  item_id: string; // RUBRO ID
  deleted_at: string; // FECHA DE ELIMINACIÓN
};

type UpdateArticlesPayload = {
  id: string;
  images?: string[]; // URL DE IMAGENES (SEPARADOS POR ;)
  pdfs?: string[]; // URL DE PDFS (SEPARADOS POR ;)
};

export const articlesApi = createApi({
  reducerPath: "articlesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getAllArticles: builder.query<Article[], null>({
      query: () => `/articles?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Article[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron usuarios en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getArticles: builder.query<Article[], { page?: number; limit?: number, query?: string }>({
      query: ({ page = 1, limit = 10, query = "" } = {}) => {
        return `/articles?page=${page}&limit=${limit}&q=${query}&token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
      transformResponse: (response: Article[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron artículos en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getArticleById: builder.query<Article, { id: string }>({
      query: ({ id }) => `/articles/${id}`,
    }),
    countArticles: builder.query<number, null>({
      query: () => {
        return `/articles/count-all?token=${process.env.NEXT_PUBLIC_TOKEN}`;
      },
    }),
    updateArticle: builder.mutation<Article, UpdateArticlesPayload>({
      query: ({ id, ...updatedArticle }) => ({
        url: `/articles/update-one/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "PUT",
        body: updatedArticle,
      }),
    }),
    deleteArticle: builder.mutation<void, string>({
      query: (id) => ({
        url: `/articles/${id}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetArticlesQuery,
  useGetArticleByIdQuery,
  useGetAllArticlesQuery,
  useCountArticlesQuery,
  useDeleteArticleMutation,
  useUpdateArticleMutation,
} = articlesApi;
