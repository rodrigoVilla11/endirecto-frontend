import React, { useEffect, useRef, useState } from "react";
import CardArticle from "./components/CardArticles";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useAuth } from "@/app/context/AuthContext";
import CardArticles from "@/app/components/Catalogue/components/Articles/components/CardArticles";
import ListArticle from "@/app/components/Catalogue/components/Articles/components/ListArticle";
import ListArticles from "./components/ListArticles";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useClient } from "@/app/context/ClientContext";

const Articles = ({
  brand,
  item,
  vehicleBrand,
  stock,
  tags,
  order,
  showPurchasePrice,
  showArticles,
}: any) => {

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    brand,
    item,
    vehicleBrand,
    stock,
    tags,
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

  const { isAuthenticated } = useAuth();

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
    }, [data, page, filters, isFetching]);

  // Configurar Intersection Observer para scroll infinito
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
    setPage(1); // Reinicia la paginación
    setItems([]); // Limpia los datos anteriores
    setFilters({
      brand,
      item,
      vehicleBrand,
      stock,
      tags,
      sort: "",
    });
  }, [brand, item, vehicleBrand, stock, tags, order]);

  return (
    <div className="h-screen m-4 flex flex-col text-sm">
      {showArticles === "catalogue" ? (
        <div
          className={`overflow-auto no-scrollbar h-[calc(100vh-10px)] overflow-y-auto grid ${
            isOpen ? "grid-cols-3" : "grid-cols-4"
          } gap-y-10 gap-x-4`}
        >
          {items?.map((article: any, index: number) =>
            !isAuthenticated ? (
              <CardArticle
                key={index}
                article={article}
                showPurchasePrice={showPurchasePrice}
              />
            ) : (
              <CardArticles
                key={index}
                article={article}
                showPurchasePrice={showPurchasePrice}
              />
            )
          )}
        </div>
      ) : (
        <div className="overflow-auto no-scrollbar h-[calc(100vh-10px)]">
          {items?.map((article: any, index: number) =>
            isAuthenticated ? (
              <ListArticle
                key={index}
                article={article}
                showPurchasePrice={showPurchasePrice}
              />
            ) : (
              <ListArticles
                key={index}
                article={article}
                showPurchasePrice={showPurchasePrice}
              />
            )
          )}
        </div>
      )}
      <div ref={observerRef} className="h-10" />
    </div>
  );
};

export default Articles;
