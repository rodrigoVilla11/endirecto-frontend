"use client";
import React from "react";
import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomersBrandsByBrandAndCustomerIdQuery } from "@/redux/services/customersBrandsApi";
import { useGetArticleBonusByItemIdQuery } from "@/redux/services/articlesBonusesApi";
import { useGetCustomersItemsByItemAndCustomerIdQuery } from "@/redux/services/customersItemsApi";
import { useTranslation } from "react-i18next";
import { skipToken } from "@reduxjs/toolkit/query";
import { useMobile } from "@/app/context/ResponsiveContext";

const SuggestedPrice = ({ article, showPurchasePrice, onlyPrice }: any) => {
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const encodedId = encodeURIComponent(article?.id);

  const { selectedClientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });

  const articleIdForBonus = article?.item_id;

  const { data: bonus } = useGetArticleBonusByItemIdQuery(
    articleIdForBonus ? { id: articleIdForBonus } : skipToken
  );

  const articleIdForBrand = article?.brand_id;

  const { data: brandMargin } = useGetCustomersBrandsByBrandAndCustomerIdQuery({
    id: articleIdForBrand || "",
    customer: selectedClientId || "",
  });
  const { data: itemMargin } = useGetCustomersItemsByItemAndCustomerIdQuery({
    id: articleIdForBonus || "",
    customer: selectedClientId || "",
  });

  let margin: number | undefined;
  if (Array.isArray(brandMargin) && brandMargin.length > 0) {
    margin = brandMargin[0]?.margin;
  }

  let marginItem: number | undefined;
  if (Array.isArray(itemMargin) && itemMargin.length > 0) {
    marginItem = itemMargin[0]?.margin;
  }

  const priceEntry = data?.find(
    (item) => item.price_list_id === customer?.price_list_id
  );
  let price = priceEntry ? priceEntry.price : 0;

  if (bonus?.percentage_1 && typeof price === "number") {
    const discount = (price * bonus.percentage_1) / 100;
    price -= discount;
  }

  const totalMargin = (margin || 0) + (marginItem || 0);

  const calculatePriceWithMarginAndVAT = (
    price: number,
    margin: number,
    vatRate: number
  ) => {
    if (typeof price === "number" && margin !== undefined) {
      const priceWithMargin = price * (1 + margin / 100);
      const finalPrice = priceWithMargin * (1 + vatRate / 100);
      return finalPrice;
    }
    return 0;
  };

  const priceWithMarginAndVAT = calculatePriceWithMarginAndVAT(
    price,
    totalMargin,
    21
  );

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

  const [integerPart, decimalPart] = formatPrice(priceWithMarginAndVAT);

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
          {isMobile ? "Precio Sugerido" : t("suggestedPrice")}
        </p>
      )}

      {/* Precio */}
      <p
        className={`
        font-extrabold
        text-white
        ${isMobile ? "text-base" : "text-lg"}
        tracking-tight
      `}
      >
        ${integerPart || "0"}
        {decimalPart && <span className="text-xs">,{decimalPart}</span>}
      </p>
    </div>
  );
};

export default SuggestedPrice;
