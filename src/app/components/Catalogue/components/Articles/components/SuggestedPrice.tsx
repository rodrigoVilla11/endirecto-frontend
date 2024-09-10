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
    <div className="flex justify-between items-center font-bold p-2 text-secondary text-sm">
      <p>Suggested Price</p>
      <p>
        $<span className="text-xl">{integerPart}</span>
        {decimalPart && <span className="text-md">.{decimalPart}</span>}
      </p>
    </div>
  );
};

export default SuggestedPrice;
