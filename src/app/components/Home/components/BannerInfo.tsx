"use client";
import { useCountArticlesQuery } from "@/redux/services/articlesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useCountCustomersQuery } from "@/redux/services/customersApi";
import React from "react";

const BannerInfo = () => {
  const { data: countCustomersData } = useCountCustomersQuery(null);
  const { data: countArticlesData } = useCountArticlesQuery({});
  const { data: brands } = useGetBrandsQuery(null);


  return (
    <div className="h-60 w-full bg-secondary flex justify-center items-center gap-10">
      <div className="h-44 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-7xl">{countCustomersData}</p>
        <p className="text-secondary">Customers</p>
      </div>
      <div className="h-44 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-7xl">{brands?.length}</p>
        <p className="text-secondary">Brands</p>
      </div>
      <div className="h-44 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-7xl">{countArticlesData}</p>
        <p className="text-secondary">Articles</p>
      </div>
    </div>
  );
};

export default BannerInfo;
