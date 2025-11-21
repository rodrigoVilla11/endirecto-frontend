"use client";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useCountCustomersQuery } from "@/redux/services/customersApi";
import React from "react";
import { useTranslation } from "react-i18next";
import { Users, Tag, Package } from "lucide-react";

const BannerInfo = () => {
  const { t } = useTranslation();
  const { data: countCustomersData } = useCountCustomersQuery({});
  const { data } = useGetArticlesQuery({
    page: 1,
    limit: 1,
    priceListId: "3",
  });
  const { data: brands } = useGetBrandsQuery(null);
  const { isMobile } = useMobile();

  const stats = [
    {
      icon: <Users className="w-12 h-12 text-pink-500" />,
      value: countCustomersData || 0,
      label: t("customers"),
      gradient: "from-pink-500 to-rose-500"
    },
    {
      icon: <Tag className="w-12 h-12 text-purple-500" />,
      value: brands?.length || 0,
      label: t("brands"),
      gradient: "from-purple-500 to-indigo-500"
    },
    {
      icon: <Package className="w-12 h-12 text-blue-500" />,
      value: data?.totalItems || 0,
      label: t("articles"),
      gradient: "from-blue-500 to-cyan-500"
    }
  ];

  return (
    <div className={`w-full py-20 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 relative overflow-hidden`}>
      {/* Elementos decorativos */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-8`}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-3xl"
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`p-4 rounded-2xl bg-white bg-opacity-10`}>
                  {stat.icon}
                </div>
                <p className="text-6xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-gray-600 font-bold text-lg uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerInfo;