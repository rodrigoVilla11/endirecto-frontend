import React from "react";
import CardArticle from "./components/CardArticles";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useFilters } from "@/app/context/FiltersContext";
import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";
import { useGetBrandByIdQuery } from "@/redux/services/brandsApi";
import { useGetItemByIdQuery } from "@/redux/services/itemsApi";
import { useGetArticleVehicleByIdQuery } from "@/redux/services/articlesVehicles";
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
  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page: 1,
    limit: 20,
    brand: brand,
    item: item,
    tags: tags,
    stock: stock,
    vehicle_brand: vehicleBrand,
  });
  const { isAuthenticated } = useAuth();

  const { isOpen } = useSideMenu();

  return (
    <div className="h-screen m-4 flex flex-col text-sm">
      {showArticles === "catalogue" ? (
        <div
          className={`overflow-auto no-scrollbar h-[calc(100vh-10px)] overflow-y-auto grid ${
            isOpen ? "grid-cols-3" : "grid-cols-4"
          } gap-y-10 gap-x-4`}
        >
          {data?.map((article: any, index: number) =>
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
          {data?.map((article: any, index: number) =>
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
    </div>
  );
};

export default Articles;
