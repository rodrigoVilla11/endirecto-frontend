import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Article = {
    name: string; // DESCRIPCION CORTA
    description: string; // DESCRIPCION LARGA
    description_alt?: string; // DESCRIPCION ALTERNATIVA XRA SELECCION
    supplier_code: string; // CODIGO DE PROVEEDOR
    barcode?: string; // CODIGO DE BARRA
    images?: string; // URL DE IMAGENES (SEPARADOS POR ;)
    images_status?: 'DOWNLOADED' | 'PENDING'; // ESTADO DE DESCARGA
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
    tag?: 'COMBO' | 'HIGHLIGHTED' | 'NEW' | 'OFFER' | 'OUTLET'; // ETIQUETA
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

export const articlesApi = createApi({
  reducerPath: "articlesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || 'http://localhost:3000', // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    getArticles: builder.query<Article[], null>({
      query: () => `/articles?token=${process.env.NEXT_PUBLIC_TOKEN}`,
      transformResponse: (response: Article[]) => {
        if (!response || response.length === 0) {
          console.error("No se recibieron clientes en la respuesta");
          return [];
        }
        return response;
      },
    }),
    getArticleById: builder.query<Article, { id: string }>({
      query: ({ id }) => `/articles/${id}`,
    }),
  }),
});

export const { useGetArticlesQuery, useGetArticleByIdQuery } = articlesApi;
