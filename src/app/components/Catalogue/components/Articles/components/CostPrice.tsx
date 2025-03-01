"use client";
import React from "react";
import { useClient } from "@/app/context/ClientContext";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useGetArticleBonusByItemIdQuery } from "@/redux/services/articlesBonusesApi";
import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useTranslation } from "react-i18next";
import { skipToken } from "@reduxjs/toolkit/query";

const CostPrice = ({ article, onlyPrice }: any) => {
  const { t } = useTranslation();
  const encodedId = encodeURIComponent(article.id);

  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });
  const { selectedClientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const articleIdForBonus = article?.item?.id;

const { data: bonus } = useGetArticleBonusByItemIdQuery(
  articleIdForBonus ? { id: articleIdForBonus } : skipToken
);
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
    <div className={`flex ${onlyPrice ? "justify-center" : "justify-between"} items-center`}>
      {!onlyPrice && <p className="text-gray-500  text-xs">{t("costPriceExclVAT")}</p>}
      <div className="flex flex-col items-end">
        {offer !== null ? (
          <>
            <span className="line-through text-red-500 ">
              ${integerPart || "0"}
              {decimalPart && <span className="text-red-500 text-xs">,{decimalPart}</span>}
            </span>
            <span className="font-semibold text-gray-800">
              ${integerPartOffer}
              {decimalPartOffer && <span className="text-sm">,{decimalPartOffer}</span>}
            </span>
          </>
        ) : (
          <span className="font-semibold text-gray-800">
            ${integerPart || "0"}
            {decimalPart && <span className="text-xs">,{decimalPart}</span>}
          </span>
        )}
      </div>
    </div>
  );
};

export default CostPrice;
