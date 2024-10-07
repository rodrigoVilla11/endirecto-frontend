import React from "react";
import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";

const SuggestedPrice = ({ articleId }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });

  const priceEntry = data?.find((item) => item.price_list_id === "3");
  const price = priceEntry ? priceEntry.price : "N/A";

  const formattedPrice = typeof price === "number" ? price.toFixed(2) : price;

  const [integerPart, decimalPart] =
    typeof price === "number" ? formattedPrice.split(".") : ["N/A", ""];

  return (
    <div className="flex justify-between text-xs px-4 h-4">
      <p>Suggested Price</p>
      <p>
        $<span className="font-semibold text-gray-600">{integerPart}</span>
        {decimalPart && <span className="font-semibold text-gray-600">.{decimalPart}</span>}
      </p>
    </div>
  );
};

export default SuggestedPrice;
