import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useFilters } from '@/app/context/FiltersContext';
import { useClient } from '@/app/context/ClientContext';
import { useGetCustomerByIdQuery } from '@/redux/services/customersApi';
import { useGetArticlesQuery } from '@/redux/services/articlesApi';
import CardArticles from './components/CardArticles';
import ListArticle from './components/ListArticle';
import { useMobile } from '@/app/context/ResponsiveContext';

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
  const { isMobile } = useMobile();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const filtersStringRef = useRef<string>('');

  const { engine, model, year } = useFilters();
  const filters = useMemo(() => {
    const f: Record<string, any> = {};
    if (brand) f.brand = brand;
    if (item) f.item = item;
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

  const { selectedClientId: clientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({ id: clientId || "" });
  const priceListId = customer?.price_list_id;

  const { data: articlesData, isFetching } = useGetArticlesQuery(
    {
      page,
      limit: 20,
      priceListId,
      ...filters
    },
    { skip: !priceListId }
  );

  useEffect(() => {
    if (filtersStringRef.current !== filtersString) {
      setPage(1);
      setItems([]);
      filtersStringRef.current = filtersString;
    }
  }, [filtersString]);

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

  const lastArticleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetching) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
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

  // Pantalla de carga inicial
  if (page === 1 && isFetching && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
        <div className="relative">
          <Image 
            src="/dma.png" 
            alt="Logo" 
            width={isMobile ? 120 : 150} 
            height={isMobile ? 120 : 150}
            className="animate-pulse"
          />
        </div>
        <div className="mt-6 w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-500 via-white to-blue-500 animate-loading-bar rounded-full"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-600 animate-pulse">
          Cargando artículos...
        </p>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'p-2' : 'p-4'} min-h-screen`}>
      {items.length === 0 && !isFetching ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No se encontraron artículos
            </h3>
            <p className="text-gray-500 text-sm">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        </div>
      ) : (
        <>
          {showArticles === "catalogue" ? (
            <div className={`grid gap-3 md:gap-4 ${
              isMobile 
                ? 'grid-cols-2' 
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {items.map((article, index) => {
                if (index === items.length - 1) {
                  return (
                    <div key={article.id} ref={lastArticleRef} className="w-full">
                      <CardArticles article={article} showPurchasePrice={showPurchasePrice} />
                    </div>
                  );
                }
                return (
                  <div key={article.id} className="w-full">
                    <CardArticles article={article} showPurchasePrice={showPurchasePrice} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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
          
          {/* Indicador de carga para scroll infinito */}
          {isFetching && page > 1 && (
            <div className="flex justify-center mt-6 mb-6">
              <Spinner />
            </div>
          )}

          {/* Indicador de fin de resultados */}
          {!isFetching && (articlesData?.articles?.length ?? 0) < 20 && items.length > 0 && (
            <div className="flex justify-center mt-8 mb-4">
              <div className="bg-gray-100 text-gray-600 px-6 py-3 rounded-full text-sm font-medium">
                ✓ Todos los artículos cargados
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Articles;

const Spinner = () => (
  <div className="flex flex-col items-center gap-3">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin"></div>
    </div>
    <p className="text-sm text-gray-600 font-medium">Cargando más artículos...</p>
  </div>
);