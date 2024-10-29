import React from "react";
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
  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page: 1,
    limit: 20,
    brand: brand,
    item: item,
    tags: tags,
    stock: stock,
    vehicle_brand: vehicleBrand,
  });

  const { isOpen } = useSideMenu();

  return (
    <div className="h-full m-4 flex flex-col text-sm">
      {showArticles === "catalogue" ? (
        <div
          className={`overflow-auto no-scrollbar h-[calc(100vh-10px)] overflow-y-auto grid ${
            isOpen ? "grid-cols-3" : "grid-cols-4"
          } gap-y-10 gap-x-4`}
        >
          {data?.map((article: any, index: number) => (
            <CardArticles
              key={index}
              article={article}
              showPurchasePrice={showPurchasePrice}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-auto no-scrollbar h-[calc(100vh-10px)]">
          {data?.map((article: any, index: number) => (
            <ListArticle
              key={index}
              article={article}
              showPurchasePrice={showPurchasePrice}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Articles;
