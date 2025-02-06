import React, { useEffect, useRef, useState } from "react";
import CardArticles from "./components/CardArticles";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import ListArticle from "./components/ListArticle";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
const Articles = ({
  brand,
  item,
  vehicleBrand,
  stock,
  tags,
  cart,
  order,
  showPurchasePrice,
  showArticles,
  query,
}: any) => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    brand,
    item,
    vehicleBrand,
    stock,
    tags,
    query,
    sort: order,
  });
const { selectedClientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page,
    limit: 20,
    priceListId: customer?.price_list_id,
    ...filters,
  });


  const { isOpen } = useSideMenu();
  const [items, setItems] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFetching && data) { // 🔹 Verifica que data esté disponible
      setIsFetching(true);
      
      const newArticles = data.articles || []; // 🔹 Usa `data.articles` en lugar de `result.data.articles`
  
      if (page === 1) {
        setItems(newArticles); // 🔹 Si es la primera página, reemplaza
      } else {
        setItems((prev) => [...prev, ...newArticles]); // 🔹 Si es paginación, agrega más
      }
  
      setIsFetching(false);
    }
  }, [data, page, filters]);
  
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [isFetching]);

  useEffect(() => {
    setPage(1); 
    setItems([]); 
    setFilters((prevFilters) => ({
      ...prevFilters,
      brand,
      item,
      vehicleBrand,
      stock,
      tags,
      query,
      sort: order, 
    }));
  }, [brand, item, vehicleBrand, stock, tags, query, order]);
  

  return (
    <div className="h-full m-4 flex flex-col text-sm ">
      {showArticles === "catalogue" ? (
        <div
          className={`overflow-auto no-scrollbar h-[calc(100vh-10px)] grid gap-6  justify-items-center ${
            isOpen
              ? "grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))]"
              : "grid-cols-[repeat(auto-fit,_minmax(220px,_1fr))]"
          }`}
        >
          {items?.map((article: any, index: number) => (
            <CardArticles
              key={index}
              article={article}
              showPurchasePrice={showPurchasePrice}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-auto no-scrollbar h-[calc(100vh-10px)]">
          {items?.map((article: any, index: number) => (
            <ListArticle
              key={index}
              article={article}
              showPurchasePrice={showPurchasePrice}
            />
          ))}
        </div>
      )}
      <div ref={observerRef} className="h-100" />
    </div>
  );
};

export default Articles;
