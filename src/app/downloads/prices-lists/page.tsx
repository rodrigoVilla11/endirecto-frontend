"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa";
import {
  useCountPricesListsQuery,
  useGetPricesListPagQuery,
} from "@/redux/services/pricesListsApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useTranslation } from "react-i18next";

const Page = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, error, isLoading, refetch } = useGetPricesListPagQuery({
    page,
    limit,
    query: searchQuery,
  });
  const { data: countPricesListsData } = useCountPricesListsQuery(null);

  const tableData =
    data?.map((priceList) => ({
      key: priceList.id,
      image: priceList?.name,
      brand: priceList?.name,
      excel: priceList?.id,
      txt: priceList?.id,
    })) || [];

  const tableHeader = [
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: t("table.brand"), key: "brand", important: true },
    { name: t("table.fileExcel"), key: "excel" },
    { name: t("table.fileTxt"), key: "txt" },
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
      ? t("page.results", { count: data?.length || 0 })
      : t("page.results", { count: countPricesListsData || 0 }),
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countPricesListsData || 0) / limit)) {
      setPage(page + 1);
    }
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
        <div className="flex justify-between items-center p-4">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {t("page.previous")}
          </button>
          <p>
            {t("page.pagination", {
              page,
              total: Math.ceil((countPricesListsData || 0) / limit),
            })}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countPricesListsData || 0) / limit)}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {t("page.next")}
          </button>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default Page;
