import React, { useEffect, useRef, useState } from "react";
import CardArticle from "./components/CardArticles";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useAuth } from "@/app/context/AuthContext";
import CardArticles from "@/app/components/Catalogue/components/Articles/components/CardArticles";
import ListArticle from "@/app/components/Catalogue/components/Articles/components/ListArticle";
import ListArticles from "./components/ListArticles";

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
}: any) => {
  const [page, setPage] = useState(1);

  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page,
    limit: 10,
    brand: brand,
    item: item,
    tags: tags,
    stock: stock,
    vehicle_brand: vehicleBrand,
  });
  const { isAuthenticated } = useAuth();

  const { isOpen } = useSideMenu();

  const [items, setItems] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  if (!isFetching) {
    setIsFetching(true);
    refetch()
      .then((result) => {
        const newBrands = result.data || [];
        setItems((prev) => [...prev, ...newBrands]);
      })
      .catch((error) => {
        console.error("Error fetching articles:", error);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }
}, [page]);


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
