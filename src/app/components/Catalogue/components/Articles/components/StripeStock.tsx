import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";
import React from "react";

const StripeStock = ({ articleId, isBar = false }: { articleId: any; isBar?: boolean }) => {
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
  if (isBar) {
    return (
      <div
        className={`${getStockColor()} font-bold text-white text-center py-2 text-xs uppercase`}
      >
        <p>{getStockText()}</p>
      </div>
    );
  }

  // Si es círculo (indicador superior)
  return (
    <div
      className={`${getStockColor()} w-6 h-6 rounded-full border-2 border-white shadow-lg`}
      title={getStockText()}
    />
  );
};

export default StripeStock;