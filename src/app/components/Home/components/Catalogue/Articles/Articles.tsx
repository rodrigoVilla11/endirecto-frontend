import React from "react";
import CardArticles from "./components/CardArticles";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useFilters } from "@/app/context/FiltersContext";
import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";
import { useGetBrandByIdQuery } from "@/redux/services/brandsApi";
import { useGetItemByIdQuery } from "@/redux/services/itemsApi";
import { useGetArticleVehicleByIdQuery } from "@/redux/services/articlesVehicles";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";

const Articles = ({ brand, item, vehicleBrand, stock, tags, cart, order, showPurchasePrice }: any) => {

  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page: 1,  
    limit: 20,
    brand: brand,
    item: item,
    tags: tags,
    stock: stock,
    vehicle_brand: vehicleBrand
  });

  const { isOpen } = useSideMenu();

  return (
    <div className="h-screen m-4 flex flex-col text-sm">
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
    </div>
  );
};

export default Articles;
