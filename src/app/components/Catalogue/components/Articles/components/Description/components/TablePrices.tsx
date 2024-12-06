import React from "react";
import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";

const TablePrices = ({ article }: any) => {
  const encodedId = encodeURIComponent(article.id);
  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });

  const priceEntryNoIva = data?.find((item) => item.price_list_id === "2");
  const priceNoIva = priceEntryNoIva ? priceEntryNoIva.price : "N/A";
  const formattedPriceNoIva =
    typeof priceNoIva === "number" ? priceNoIva.toFixed(2) : priceNoIva;

  const iva = 0.21;

  const priceWithIva =
    typeof priceNoIva === "number"
      ? (priceNoIva * (1 + iva)).toFixed(2)
      : "N/A";

  const netPriceEntry = data?.find((item) => item.price_list_id === "1");
  const netPrice = netPriceEntry ? netPriceEntry.price : "N/A";
  const formattedNetPrice =
    typeof netPrice === "number" ? netPrice.toFixed(2) : netPrice;

  return (
    <div className="">  
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">IVA</p>
        <p className="font-light">21,00%</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Bonuses</p>
        <p className="font-light max-w-40">20,00%</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between bg-red-400">
        <p className="font-bold">Net Price</p>
        <p className="font-light max-w-40">$ {formattedNetPrice}</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Margin</p>
        <p className="font-light max-w-40">40,00% + 0,00%</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Margin $</p>
        <p className="font-light max-w-40">$ 2.032,86</p>
      </div>

      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Suggested Price w/IVA</p>
        <p className="font-light max-w-40">$ 8.609,17</p>
      </div>
      <hr />
    </div>
  );
};

export default TablePrices;
