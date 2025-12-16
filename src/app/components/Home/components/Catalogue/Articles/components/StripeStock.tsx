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
      className={`
      px-3 py-1
      rounded-full
      text-xs font-extrabold
      text-center
      border
      ${
        hasStock === "IN-STOCK"
          ? "bg-white/5 text-white border-white/10"
          : hasStock === "LIMITED-STOCK"
          ? "bg-[#E10600]/15 text-[#E10600] border-[#E10600]/40"
          : hasStock === "NO-STOCK"
          ? "bg-white/5 text-white/60 border-white/10"
          : "bg-white/5 text-white/60 border-white/10"
      }
    `}
    >
      {hasStock === "IN-STOCK" && "En stock"}
      {hasStock === "LIMITED-STOCK" && "Stock limitado"}
      {hasStock === "NO-STOCK" && "Sin stock"}
    </div>
  );
};

export default StripeStock;
