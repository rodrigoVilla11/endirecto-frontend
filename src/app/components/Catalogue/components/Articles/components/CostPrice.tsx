import { useClient } from "@/app/context/ClientContext";
import { useGetArticleByIdQuery } from "@/redux/services/articlesApi";
import { useGetArticleBonusByItemIdQuery } from "@/redux/services/articlesBonusesApi";
import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import React from "react";

const CostPrice = ({ articleId, onlyPrice }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });
  const { selectedClientId } = useClient();

  const { data: article } = useGetArticleByIdQuery({ id: encodedId });

  const { data: bonus } = useGetArticleBonusByItemIdQuery({
    id: article?.item_id || "",
  });

  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const priceEntry = data?.find(
    (item) => item.price_list_id === customer?.price_list_id
  );
  let price = priceEntry ? priceEntry.price : "N/A";

  if (bonus?.percentage_1 && typeof price === "number") {
    const discount = (price * bonus.percentage_1) / 100; // Calcular el descuento
    price -= discount; // Aplicar el descuento al precio
  }

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

  const offer = data?.find(
    (item) => item.price_list_id === customer?.price_list_id
  )?.offer;

  const [integerPartOffer, decimalPartOffer] = formatPrice(offer);

  return (
    <div
      className={`flex ${
        onlyPrice ? "justify-center" : "justify-between"
      } text-xs px-4 h-4 items-center`}
    >
      {!onlyPrice && <p>P. Costo s/IVA</p>}

      {offer !== null ? (
        <div className="flex flex-col items-end">
          {/* Precio original tachado */}
          <span className="line-through text-red-500 text-sm flex">
            <p className="text-gray-800">$ {integerPart || "0"}</p>
            {decimalPart && (
              <p className="font-semibold text-gray-800">
                ,{decimalPart}
              </p>
            )}
          </span>
          {/* Precio actual */}
          <p>
            $
            <span className="font-semibold text-gray-800 text-lg">
              {integerPartOffer}
            </span>
            {decimalPartOffer && (
              <span className="font-semibold text-gray-800">
                ,{decimalPartOffer}
              </span>
            )}
          </p>
        </div>
      ) : (
        <p>
          $
          <span className="font-semibold text-gray-800 text-lg">
            {integerPart || "0"}
          </span>
          {decimalPart && (
            <span className="font-semibold text-gray-800">,{decimalPart}</span>
          )}
        </p>
      )}
    </div>
  );
};

export default CostPrice;
