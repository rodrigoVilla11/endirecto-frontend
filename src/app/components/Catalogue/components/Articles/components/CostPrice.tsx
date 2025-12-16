"use client";
import React from "react";
import { useClient } from "@/app/context/ClientContext";
import { useGetArticleBonusByItemIdQuery } from "@/redux/services/articlesBonusesApi";
import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useTranslation } from "react-i18next";
import { skipToken } from "@reduxjs/toolkit/query";
import { useMobile } from "@/app/context/ResponsiveContext";

const CostPrice = ({ article, onlyPrice }: any) => {
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const encodedId = encodeURIComponent(article?.id);

  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });
  const { selectedClientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const articleIdForBonus = article?.item_id;

  const { data: bonus } = useGetArticleBonusByItemIdQuery(
    articleIdForBonus ? { id: articleIdForBonus } : skipToken
  );
  const priceEntry = data?.find(
    (item) => item.price_list_id === customer?.price_list_id
  );
  let price = priceEntry ? priceEntry.price : "N/A";

  if (bonus?.percentage_1 && typeof price === "number") {
    const discount = (price * bonus.percentage_1) / 100;
    price -= discount;
  }

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
      } items-center`}
    >
      {/* Label */}
      {!onlyPrice && (
        <p
          className={`
          text-white/60
          ${isMobile ? "text-[10px]" : "text-xs"}
        `}
        >
          {isMobile ? "P. Costo s/IVA" : t("costPriceExclVAT")}
        </p>
      )}

      {/* Precio */}
      <div className="flex flex-col items-end">
        {offer !== null ? (
          <>
            {/* Precio original */}
            <span
              className={`
              line-through
              text-[#E10600]
              ${isMobile ? "text-xs" : "text-sm"}
            `}
            >
              ${integerPart || "0"}
              {decimalPart && (
                <span className="text-[10px]">,{decimalPart}</span>
              )}
            </span>

            {/* Precio oferta */}
            <span
              className={`
              font-extrabold
              text-white
              ${isMobile ? "text-sm" : "text-base"}
            `}
            >
              ${integerPartOffer}
              {decimalPartOffer && (
                <span className="text-xs">,{decimalPartOffer}</span>
              )}
            </span>
          </>
        ) : (
          <span
            className={`
            font-extrabold
            text-white
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            ${integerPart || "0"}
            {decimalPart && <span className="text-xs">,{decimalPart}</span>}
          </span>
        )}

        {/* Acento visual */}
        <div className="mt-1 h-0.5 w-full bg-[#E10600] opacity-80 rounded-full" />
      </div>
    </div>
  );
};

export default CostPrice;
