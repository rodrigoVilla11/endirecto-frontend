import React from "react";
import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useClient } from "@/app/context/ClientContext";

const SuggestedPrice = ({ articleId, showPurchasePrice }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });
  const { selectedClientId } = useClient();

  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const priceEntry = data?.find(
    (item) => item.price_list_id === customer?.price_list_id
  );
  const price = priceEntry ? priceEntry.price : "N/A";

  // Función para calcular el precio con IVA
  const calculatePriceWithVAT = (price: any, vatRate: number) => {
    if (typeof price === "number") {
      return price + price * (vatRate / 100);
    }
    return "N/A";
  };

  const priceWithVAT = calculatePriceWithVAT(price, 21); // 21% de IVA

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

  const [integerPart, decimalPart] = formatPrice(priceWithVAT);

  return (
    <div className={`flex justify-between items-center text-xs pb-2 h-4`}>
      <p className="text-white/70 font-semibold">Suggested Price</p>

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

export default SuggestedPrice;
