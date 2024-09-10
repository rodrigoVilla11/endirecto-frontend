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
      className={`h-4 w-full ${
        hasStock === "IN-STOCK"
          ? "bg-success" 
          : hasStock === "NO-STOCK"
          ? "bg-red-600" 
          : hasStock === "LIMITED-STOCK"
          ? "bg-orange-600" 
          : "bg-gray-500" 
      } font-bold text-white flex justify-center items-center`}
    >
      <p>{hasStock}</p>
    </div>
  );
};

export default StripeStock;
