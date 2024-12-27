import React, { useEffect, useRef, useState } from "react";
import CardArticles from "./components/CardArticles";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import ListArticle from "./components/ListArticle";
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
    limit: 5,
    brand: brand,
    item: item,
    tags: tags,
    stock: stock,
    vehicle_brand: vehicleBrand,
  });

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
    <div className="h-full m-4 flex flex-col text-sm">
      {showArticles === "catalogue" ? (
        <div
          className={`overflow-auto no-scrollbar h-[calc(100vh-10px)] grid gap-6 ${
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
