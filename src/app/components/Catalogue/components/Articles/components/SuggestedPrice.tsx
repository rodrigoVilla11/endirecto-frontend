import React from "react";
import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";

const SuggestedPrice = ({ articleId, showPurchasePrice }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });

  const priceEntry = data?.find((item) => item.price_list_id === "3");
  const price = priceEntry ? priceEntry.price : "N/A";

  // Función para formatear el precio con separadores de miles
  const formatPrice = (price :any) => {
    if (typeof price === "number") {
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
      return formatted.split(",");
    }
    return ["N/A", ""];
  };

  const [integerPart, decimalPart] = formatPrice(price);

  return (
    <div
      className={`flex justify-between items-center ${
        showPurchasePrice ? "text-xs" : "text-xs"
      } px-4 pb-2 h-4 `}
    >
      <p>Suggested Price</p>
      <p>
        $<span className="font-semibold text-gray-600 text-lg">{integerPart}</span>
        {decimalPart && <span className="font-semibold text-gray-600">,{decimalPart}</span>}
      </p>
    </div>
  );
};

export default SuggestedPrice;
