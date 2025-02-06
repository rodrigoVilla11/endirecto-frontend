import React from "react";
import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomersBrandsByBrandAndCustomerIdQuery } from "@/redux/services/customersBrandsApi";
import {
  useGetArticlesQuery,
} from "@/redux/services/articlesApi";
import { useGetArticleBonusByItemIdQuery } from "@/redux/services/articlesBonusesApi";
import { useGetCustomersItemsByItemAndCustomerIdQuery } from "@/redux/services/customersItemsApi";

const SuggestedPrice = ({ articleId, showPurchasePrice, onlyPrice }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { selectedClientId } = useClient();
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });
  // Consultas de datos
  const {
    data: articles,
    isLoading: isArticleLoading,
    error: articleError,
  } = useGetArticlesQuery({
    page: 1,
    limit: 1,
    articleId: articleId || "",
    priceListId: customer?.price_list_id,
  });

  const article = articles?.articles[0];

  const { data: bonus } = useGetArticleBonusByItemIdQuery({
    id: article?.item.id || "",
  });
  const { data: brandMargin } = useGetCustomersBrandsByBrandAndCustomerIdQuery({
    id: article?.brand.id || "",
    customer: selectedClientId || "",
  });
  const { data: itemMargin } = useGetCustomersItemsByItemAndCustomerIdQuery({
    id: article?.item.id || "",
    customer: selectedClientId || "",
  });

  // Obtener el margen de la marca
  let margin: number | undefined;
  if (Array.isArray(brandMargin) && brandMargin.length > 0) {
    margin = brandMargin[0]?.margin;
  } else {
    // console.log("brandMargin no es un array o está vacío.");
  }

  // Obtener el margen del artículo
  let marginItem: number | undefined;
  if (Array.isArray(itemMargin) && itemMargin.length > 0) {
    marginItem = itemMargin[0]?.margin;
  } else {
    // console.log("itemMargin no es un array o está vacío.");
  }

  // Obtener el precio base
  const priceEntry = data?.find(
    (item) => item.price_list_id === customer?.price_list_id
  );
  let price = priceEntry ? priceEntry.price : 0;

  // Aplicar descuento si existe
  if (bonus?.percentage_1 && typeof price === "number") {
    const discount = (price * bonus.percentage_1) / 100; // Calcular el descuento
    price -= discount; // Aplicar el descuento al precio
  }

  // Calcular el margen total (sumando margin y marginItem si son mayores a 0)
  const totalMargin = (margin || 0) + (marginItem || 0);

  // Función para calcular el precio con margen y luego IVA
  const calculatePriceWithMarginAndVAT = (
    price: number,
    margin: number,
    vatRate: number
  ) => {
    if (typeof price === "number" && margin !== undefined) {
      // Primero aplicamos el margen total (sumado margin + marginItem)
      const priceWithMargin = price * (1 + margin / 100);

      // Luego aplicamos el IVA sobre el precio con margen
      const finalPrice = priceWithMargin * (1 + vatRate / 100);
      return finalPrice;
    }
    return 0;
  };

  // Calculamos el precio con el margen total y luego con IVA
  const priceWithMarginAndVAT = calculatePriceWithMarginAndVAT(
    price,
    totalMargin,
    21
  );

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
    return ["N/A", ""]; // Devuelve "N/A" si no es un número válido
  };

  const [integerPart, decimalPart] = formatPrice(priceWithMarginAndVAT);

  return (
    <div
      className={`flex ${
        onlyPrice ? "justify-center" : "justify-between"
      } items-center ${
        showPurchasePrice ? "text-xs" : "text-xs"
      } px-4 pb-2 h-4 `}
    >
      <p>Suggested Price</p>
      <p>
        $
        <span className="font-semibold text-gray-600 text-lg">
          {integerPart || "0"}
        </span>
        {decimalPart && (
          <span className="font-semibold text-gray-600">,{decimalPart}</span>
        )}
      </p>
    </div>
  );
};

export default SuggestedPrice;
