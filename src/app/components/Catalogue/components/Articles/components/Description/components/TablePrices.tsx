import React from "react";
import { useGetArticlePriceByArticleIdQuery } from "@/redux/services/articlesPricesApi";
import { useGetArticleBonusByItemIdQuery } from "@/redux/services/articlesBonusesApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomersBrandsByBrandAndCustomerIdQuery } from "@/redux/services/customersBrandsApi";
import { useGetCustomersItemsByItemAndCustomerIdQuery } from "@/redux/services/customersItemsApi";

const TablePrices = ({ article }: any) => {
  const encodedId = encodeURIComponent(article.id);
  const { data, error, isLoading, refetch } =
    useGetArticlePriceByArticleIdQuery({ articleId: encodedId });
  const { selectedClientId } = useClient();

  const { data: bonus } = useGetArticleBonusByItemIdQuery({
    id: article?.item.id || "",
  });
  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const priceEntryNoIva = data?.find(
    (item) => item.price_list_id === customer?.price_list_id
  );
  let priceNoIva = priceEntryNoIva ? priceEntryNoIva.price : "N/A";

  if (bonus?.percentage_1 && typeof priceNoIva === "number") {
    const discount = (priceNoIva * bonus.percentage_1) / 100; // Calcular el descuento
    priceNoIva -= discount; // Aplicar el descuento al precio
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
    id: article?.brand.id || "",
    customer: selectedClientId || "",
  });
  console.log(brandMargin)
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
  const totalMargin = (margin || 0) + (marginItem || 0);

  const calculateMargin = (price: string | number, margin: number) => {
    if (typeof price === "number" && margin !== undefined) {
      // Calculamos el margen como un valor absoluto
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
      // Primero aplicamos el margen total (sumado margin + marginItem)
      const priceWithMargin = price * (1 + margin / 100);

      // Luego aplicamos el IVA sobre el precio con margen
      const finalPrice = priceWithMargin * (1 + vatRate / 100);
      return finalPrice;
    }
    return 0;
  };

  const finalMargin = calculateMargin(priceNoIva, totalMargin);

  
  // Calculamos el precio con el margen total y luego con IVA
  const priceWithMarginAndVAT = calculatePriceWithMarginAndVAT(
    priceNoIva,
    totalMargin,
    21
  );

  const [integerPart, decimalPart] = formatPrice(priceWithMarginAndVAT);

  const [integerPartMargin, decimalPartMargin] = formatPrice(finalMargin);

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
        <p className="font-light max-w-40">{bonus?.percentage_1},00%</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between bg-red-400">
        <p className="font-bold">Net Price</p>
        <p className="font-light max-w-40">
          $ {integerPartNoIva},{decimalPartNoIva}
        </p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Margin</p>
        <p className="font-light max-w-40">
          {margin},00% {marginItem ? +`${marginItem},00%` : ""}
        </p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Margin $</p>
        <p className="font-light max-w-40">$ {integerPartMargin},{decimalPartMargin}</p>
      </div>

      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Suggested Price w/IVA</p>
        <p className="font-light max-w-40">
          $ {integerPart},{decimalPart}
        </p>
      </div>
      <hr />
    </div>
  );
};

export default TablePrices;
