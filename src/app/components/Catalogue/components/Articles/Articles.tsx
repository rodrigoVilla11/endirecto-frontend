import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useFilters } from '@/app/context/FiltersContext';
import { useClient } from '@/app/context/ClientContext';
import { useGetCustomerByIdQuery } from '@/redux/services/customersApi';
import { useGetArticlesQuery } from '@/redux/services/articlesApi';
import CardArticles from './components/CardArticles';
import ListArticle from './components/ListArticle';

interface ArticlesProps {
  brand?: string;
  item?: string;
  vehicleBrand?: string;
  stock?: string;
  tags?: string;
  cart?: any;
  order?: string;
  showPurchasePrice?: boolean;
  showArticles?: "catalogue" | "list";
  query?: string;
}

const Articles: React.FC<ArticlesProps> = ({
  brand,
  item,
  vehicleBrand,
  stock,
  tags,
  cart,
  order,
  showPurchasePrice = false,
  showArticles = "catalogue",
  query,
}) => {
  // Estados para paginación y artículos
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Referencia para el IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Guarda el string resultante de los filtros para detectar cambios
  const filtersStringRef = useRef<string>('');

  // Obtención de filtros desde el contexto y props
  const { engine, model, year } = useFilters();
  const filters = useMemo(() => {
    const f: Record<string, any> = {};
    if (brand) f.brand = brand;
    if (item) f.item = item;
    // Solo agregamos vehicle_brand si tiene contenido (no es una cadena vacía)
    if (vehicleBrand && vehicleBrand.trim() !== "") {
      f.vehicle_brand = vehicleBrand;
    }
    if (stock) f.stock = stock;
    if (tags) f.tags = tags;
    if (query) f.query = query;
    if (order) f.sort = order;
    if (engine) f.engine = engine;
    if (model) f.model = model;
    if (year) f.year = year;
    return f;
  }, [
    brand,
    item,
    vehicleBrand,
    stock,
    tags,
    query,
    order,
    engine,
    model,
    year,
  ]);
  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  // Obtención del cliente y sus datos
  const { selectedClientId: clientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({ id: clientId || "" });
  const priceListId = customer?.price_list_id;

  // Consulta de artículos usando el priceListId y los filtros
  const { data: articlesData, isFetching } = useGetArticlesQuery(
    {
      page,
      limit: 20,
      priceListId,
      ...filters
    },
    { skip: !priceListId }
  );
  console.log(articlesData)

  // Reinicia la lista de artículos y la página cuando los filtros cambian
  useEffect(() => {
    if (filtersStringRef.current !== filtersString) {
      setPage(1);
      setItems([]);
      filtersStringRef.current = filtersString;
    }
  }, [filtersString]);

  // Agrega nuevos artículos evitando duplicados (por id)
  useEffect(() => {
    if (articlesData && articlesData.articles) {
      setItems(prevItems => {
        const newArticles = articlesData.articles.filter(
          (article: any) => !prevItems.some(item => item.id === article.id)
        );
        return [...prevItems, ...newArticles];
      });
      setIsLoadingMore(false);
    }
  }, [articlesData]);

  // Callback ref para el IntersectionObserver (scroll infinito)
  const lastArticleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetching) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          // Si se han cargado 20 artículos, se asume que hay más para paginar
          if (articlesData && articlesData.articles && articlesData.articles.length === 20) {
            setIsLoadingMore(true);
            setPage(prevPage => prevPage + 1);
          }
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetching, articlesData]
  );

  // Pantalla de carga inicial (cover full screen) para la primera página
  if (page === 1 && isFetching && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Image src="/dma.png" alt="Logo" width={150} height={150} />
        <div className="mt-4 w-1/2 h-2 bg-gray-300">
          <div className="h-full bg-blue-500 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-[calc(120vh-150px)] overflow-y-auto">
      {items.length === 0 && !isFetching ? (
        <div className="text-center text-gray-600">No se encontraron artículos</div>
      ) : (
        <>
          {showArticles === "catalogue" ? (
            <div className="grid gap-4 p-2 w-full grid-cols-[repeat(auto-fit,_minmax(120px,_1fr))] sm:grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] place-items-center">
              {items.map((article, index) => {
                // Asigna el ref al último artículo para activar el scroll infinito
                if (index === items.length - 1) {
                  return (
                    <div key={article.id} ref={lastArticleRef}>
                      <CardArticles article={article} showPurchasePrice={showPurchasePrice} />
                    </div>
                  );
                }
                return (
                  <div key={article.id}>
                    <CardArticles article={article} showPurchasePrice={showPurchasePrice} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((article, index) => {
                if (index === items.length - 1) {
                  return (
                    <div key={article.id} ref={lastArticleRef}>
                      <ListArticle article={article} showPurchasePrice={showPurchasePrice} />
                    </div>
                  );
                }
                return (
                  <div key={article.id}>
                    <ListArticle article={article} showPurchasePrice={showPurchasePrice} />
                  </div>
                );
              })}
            </div>
          )}
          {/* Indicador de carga para paginación (spinner) */}
          {isFetching && page > 1 && (
            <div className="flex justify-center mt-4">
              <Spinner />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Articles;

const Spinner = () => (
  <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);