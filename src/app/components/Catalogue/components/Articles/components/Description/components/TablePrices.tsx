import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";
import { useGetArticleBonusByItemIdQuery } from "@/redux/services/articlesBonusesApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomersBrandsByBrandAndCustomerIdQuery } from "@/redux/services/customersBrandsApi";
import { useGetCustomersItemsByItemAndCustomerIdQuery } from "@/redux/services/customersItemsApi";
import React from "react";
import { useTranslation } from "react-i18next";

const TablePrices = ({ article }: any) => {
  const { t } = useTranslation();
  const encodedId = encodeURIComponent(article.id);
  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });
  const { selectedClientId } = useClient();

  const { data: bonus } = useGetArticleBonusByItemIdQuery({
    id: article?.item_id || "",
  });
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const priceEntryNoIva = data?.find(
    (item) => item.price_list_id === customer?.price_list_id
  );
  let priceNoIva = priceEntryNoIva ? priceEntryNoIva.price : "N/A";

  if (bonus?.percentage_1 && typeof priceNoIva === "number") {
    const discount = (priceNoIva * bonus.percentage_1) / 100;
    priceNoIva -= discount;
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

  const [integerPartNoIva, decimalPartNoIva] = formatPrice(priceNoIva);

  const { data: brandMargin } = useGetCustomersBrandsByBrandAndCustomerIdQuery({
    id: article?.brand_id || "",
    customer: selectedClientId || "",
  });
  const { data: itemMargin } = useGetCustomersItemsByItemAndCustomerIdQuery({
    id: article?.item_id || "",
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

  const totalMargin = (margin || 0) + (marginItem || 0);

  const calculateMargin = (price: string | number, margin: number) => {
    if (typeof price === "number" && margin !== undefined) {
      const marginAmount = price * (margin / 100);
      return marginAmount;
    }
    return 0;
  };

  const calculatePriceWithMarginAndVAT = (
    price: string | number,
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

  const finalMargin = calculateMargin(priceNoIva, totalMargin);
  const priceWithMarginAndVAT = calculatePriceWithMarginAndVAT(
    priceNoIva,
    totalMargin,
    21
  );

  const [integerPart, decimalPart] = formatPrice(priceWithMarginAndVAT);
  const [integerPartMargin, decimalPartMargin] = formatPrice(finalMargin);

  const priceRows = [
    { label: t("iva"), value: "21,00%", highlight: false },
    { label: t("bonuses"), value: `${bonus?.percentage_1 || 0},00%`, highlight: false },
    { 
      label: t("netPrice"), 
      value: `$ ${integerPartNoIva},${decimalPartNoIva}`, 
      highlight: true 
    },
    { 
      label: t("margin"), 
      value: `${margin || 0},00% ${marginItem ? `+ ${marginItem},00%` : ''}`, 
      highlight: false 
    },
    { 
      label: t("marginValue"), 
      value: `$ ${integerPartMargin},${decimalPartMargin}`, 
      highlight: false 
    },
    { 
      label: t("suggestedPriceWithIVA"), 
      value: `$ ${integerPart},${decimalPart}`, 
      highlight: true 
    },
  ];

  return (
    <div className="space-y-2">
      {priceRows.map((row, index) => (
        <div key={index}>
          <div className={`flex justify-between items-center p-3 rounded-lg transition-all duration-200 ${
            row.highlight 
              ? 'bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 font-bold' 
              : 'hover:bg-gray-50'
          }`}>
            <p className="font-semibold text-gray-700 text-sm">{row.label}</p>
            <p className={`text-sm ${row.highlight ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
              {row.value}
            </p>
          </div>
          {index < priceRows.length - 1 && (
            <hr className="border-gray-200" />
          )}
        </div>
      ))}
    </div>
  );
};

export default TablePrices;