"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaDownload, FaImage } from "react-icons/fa";
import {
  useCountPricesListsQuery,
  useGetPricesListPagQuery,
} from "@/redux/services/pricesListsApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useTranslation } from "react-i18next";
import {
  useCountBrandsQuery,
  useGetBrandsPagQuery,
} from "@/redux/services/brandsApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useClient } from "@/app/context/ClientContext";
import { useLazyExportPriceListQuery } from "@/redux/services/articlesApi";

const ITEMS_PER_PAGE = 50;

const Page = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedClientId } = useClient();

  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const priceListId = customer?.price_list_id;
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetBrandsPagQuery(
    { page, limit: ITEMS_PER_PAGE, query: searchQuery },
    {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );
  const { data: countBrandsData } = useCountBrandsQuery(null);

  const [triggerExport, { isLoading: isDownloading }] =
    useLazyExportPriceListQuery();

  const handleDownload = (brandId: string) => {
  if (!priceListId) return;
  triggerExport({ priceListId, brandId })
    .unwrap()            // <- aquí
    .then((blob) => {    // blob es de tipo Blob
      const date = new Date().toISOString().split("T")[0];
      const filename = `lista_precios_${priceListId}_${brandId}_${date}.xlsx`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    })
    .catch((err) => {
      console.error("Error descargando el Excel:", err);
    });
};


  const tableData =
    data?.map((brand) => ({
      key: brand.id,
      id: brand.id,
      name: brand.name,
      image: (
        <div className="flex justify-center items-center">
          {brand.images ? (
            <img
              src={brand.images}
              alt={brand.name}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="text-gray-400">{t("page.noImage")}</span>
          )}
        </div>
      ),
      excel: (
        <button
          onClick={() => handleDownload(brand.id)}
          disabled={isDownloading}
          className="p-1 rounded bg-green-600 disabled:opacity-50"
        >
          {isDownloading ? "…" : <FaDownload className="text-white" />}
        </button>
      ),
      // txt: priceList?.id,
    })) || [];

  const tableHeader = [
    { name: t("table.id"), key: "id", important: true, sortable: true },
    { name: t("table.name"), key: "name", important: true, sortable: true },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
      important: true,
    },
    { name: t("table.fileExcel"), key: "excel" },
    // { name: t("table.fileTxt"), key: "txt" },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <Input
            placeholder={t("page.searchPlaceholder")}
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                refetch();
              }
            }}
          />
        ),
      },
    ],
    results: searchQuery
      ? t("page.results", { count: data?.length })
      : t("page.results", { count: countBrandsData || 0 }),
  };

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("page.pricesListsTitle")}</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
      </div>
    </PrivateRoute>
  );
};

export default Page;
