import { useClient } from "@/app/context/ClientContext";
import {
  useGetArticlePriceByArticleIdQuery,
} from "@/redux/services/articlesPricesApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import React from "react";

const CostPrice = ({ articleId, onlyPrice}: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });
  const { selectedClientId } = useClient();

  
     const {
        data: customer
      } = useGetCustomerByIdQuery({
        id: selectedClientId || "",
      });

  const priceEntry = data?.find((item) => item.price_list_id === customer?.price_list_id);
  const price = priceEntry ? priceEntry.price : "N/A";

  // Función para formatear el precio con separadores de miles
  const formatPrice = (price: any) => {
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
    className={`flex ${onlyPrice ? "justify-center" : "justify-between"} text-xs px-4 h-4 items-center`}
  >
    {!onlyPrice && <p>Cost Price s/IVA</p>}
    <p>
      $<span className="font-semibold text-gray-800 text-lg">{integerPart || "0"}</span>
      {decimalPart && <span className="font-semibold text-gray-800">,{decimalPart}</span>}
    </p>
  </div>
  
  );
};

export default CostPrice;
