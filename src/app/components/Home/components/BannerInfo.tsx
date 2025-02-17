"use client";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useCountCustomersQuery } from "@/redux/services/customersApi";
import React from "react";
import { useTranslation } from "react-i18next";

const BannerInfo = () => {
  const { t } = useTranslation();
  const { data: countCustomersData } = useCountCustomersQuery({});
  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page: 1,
    limit: 1,
    priceListId: "3",
  });
  const { data: brands } = useGetBrandsQuery(null);
  const { isMobile } = useMobile();

  return (
    <div className={`h-auto w-full p-10 bg-secondary flex ${isMobile ? "flex-col" : ""} justify-center items-center gap-10`}>
      <div className="h-32 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-5xl">{countCustomersData}</p>
        <p className="text-secondary">{t("customers")}</p>
      </div>
      <div className="h-32 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-5xl">{brands?.length}</p>
        <p className="text-secondary">{t("brands")}</p>
      </div>
      <div className="h-32 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-5xl">{data?.totalItems}</p>
        <p className="text-secondary">{t("articles")}</p>
      </div>
    </div>
  );
};

export default BannerInfo;
