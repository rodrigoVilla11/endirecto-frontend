import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import React from "react";

const CostPrice = ({ articleId, selectedClientId }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });

  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const priceEntry = data?.find(
    (item) => item.price_list_id === customer?.price_list_id
  );
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
    <div className="flex justify-between items-center text-xs h-4">
      <p className="text-white/70 font-semibold">Cost Price s/IVA</p>

      <p className="text-white">
        $
        <span className="font-extrabold text-white text-lg">{integerPart}</span>
        {decimalPart && (
          <span className="font-extrabold text-white/80">,{decimalPart}</span>
        )}
      </p>
    </div>
  );
};

export default CostPrice;
