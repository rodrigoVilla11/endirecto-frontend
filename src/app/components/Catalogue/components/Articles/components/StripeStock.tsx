import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";
import React from "react";

const StripeStock = ({
  articleId,
  isBar = false,
}: {
  articleId: any;
  isBar?: boolean;
}) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading, refetch } = useGetStockByArticleIdQuery({
    articleId: encodedId,
  });

  const hasStock = data?.status;
  const stockQuantity = data?.quantity || 0;

  // Colores según el estado
  const getStockColor = () => {
    if (hasStock === "STOCK") return "bg-green-500";
    if (hasStock === "LOW-STOCK") return "bg-yellow-500";
    if (hasStock === "NO-STOCK") return "bg-red-500";
    return "bg-gray-400";
  };

  // Texto según el estado
  const getStockText = () => {
    if (hasStock === "STOCK") return `Stock disponible: ${stockQuantity}`;
    if (hasStock === "LOW-STOCK") return `Poco stock: ${stockQuantity}`;
    if (hasStock === "NO-STOCK") return "SIN STOCK";
    return "Stock";
  };

  // Si es barra (parte inferior)
  // Barra inferior
  if (isBar) {
    return (
      <div
        className={`
        ${getStockColor()}
        font-extrabold
        text-white
        text-center
        py-2
        text-[10px]
        uppercase
        tracking-wider
        border-t border-white/10
      `}
      >
        {getStockText()}
      </div>
    );
  }

  // Indicador circular (superior)
  return (
    <div
      className={`
      ${getStockColor()}
      w-6 h-6
      rounded-full
      border-2 border-white/80
      shadow-lg
      ring-1 ring-black/30
    `}
      title={getStockText()}
    />
  );
};

export default StripeStock;
