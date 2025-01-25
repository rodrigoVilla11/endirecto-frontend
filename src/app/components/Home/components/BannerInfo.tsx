"use client";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useCountArticlesQuery } from "@/redux/services/articlesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useCountCustomersQuery } from "@/redux/services/customersApi";
import React from "react";

const BannerInfo = () => {
  const { data: countCustomersData } = useCountCustomersQuery({});
  const { data: countArticlesData } = useCountArticlesQuery({});
  const { data: brands } = useGetBrandsQuery(null);
  const { isMobile } = useMobile();


  return (
    <div className={`h-auto w-full p-10 bg-secondary flex ${isMobile ? "flex-col" : ""} justify-center items-center gap-10`}>
      <div className="h-32 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-5xl">{countCustomersData}</p>
        <p className="text-secondary">Customers</p>
      </div>
      <div className="h-32 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-5xl">{brands?.length}</p>
        <p className="text-secondary">Brands</p>
      </div>
      <div className="h-32 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-5xl">{countArticlesData}</p>
        <p className="text-secondary">Articles</p>
      </div>
    </div>
  );
};

export default BannerInfo;
