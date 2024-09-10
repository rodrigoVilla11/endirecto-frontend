import {
  useGetArticlePriceByArticleIdQuery,
} from "@/redux/services/articlesPricesApi";
import React from "react";

const CostPrice = ({ articleId }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });

  const priceEntry = data?.find((item) => item.price_list_id === "1");
  const price = priceEntry ? priceEntry.price : "N/A";

  const formattedPrice = typeof price === "number" ? price.toFixed(2) : price;

  const [integerPart, decimalPart] =
    typeof price === "number" ? formattedPrice.split(".") : ["N/A", ""];

  return (
    <div className="flex justify-between items-center font-bold p-2">
      <p>Cost Price s/IVA</p>
      <p>
        $<span className="text-xl">{integerPart}</span>
        {decimalPart && <span className="text-md">.{decimalPart}</span>}
      </p>
    </div>
  );
};

export default CostPrice;
