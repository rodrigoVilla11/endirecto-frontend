import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";
import React from "react";

const StripeStock = ({ articleId }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading, refetch } = useGetStockByArticleIdQuery({
    articleId: encodedId,
  });

  const hasStock = data?.status;
  
  return (
    <div
      className={`${
        hasStock === "STOCK"
          ? "bg-success" 
          : hasStock === "NO-STOCK"
          ? "bg-red-600" 
          : hasStock === "LOW-STOCK"
          ? "bg-yellow-400" 
          : "bg-gray-500" 
      } font-bold text-white text-center pt-1  text-xs`}
    >
      <p>{hasStock}</p>
    </div>
  );
};

export default StripeStock;
