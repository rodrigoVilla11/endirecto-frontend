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
  const { data } = useGetArticlesQuery({ page: 1, limit: 1, priceListId: "3" });
  const { data: brands } = useGetBrandsQuery(null);
  const { isMobile } = useMobile();

  const stats = [
    { icon: Users, value: countCustomersData || 0, label: t("customers") },
    { icon: Tag, value: brands?.length || 0, label: t("brands") },
    { icon: Package, value: data?.totalItems || 0, label: t("articles") },
  ];

  return (
    <section className="w-full py-16 sm:py-20 bg-[#0B0B0B] relative overflow-hidden">
      {/* Glow rojo sutil */}
      <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-[#E10600] opacity-20 rounded-full blur-3xl" />
      <div className="absolute -bottom-48 -left-48 w-[560px] h-[560px] bg-white opacity-5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Título opcional (si no lo querés, borrá este bloque) */}
        <div className="mb-10 text-center">
          <h2 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">
            En Directo en números
          </h2>
          <p className="text-white/70 mt-2">
            Datos generales del catálogo y clientes
          </p>
        </div>

        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-6 sm:gap-8`}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="
                  rounded-3xl p-8
                  bg-white/5 backdrop-blur-md
                  border border-white/10
                  shadow-xl
                  hover:border-[#E10600]/40 hover:bg-white/7
                  transition-all duration-300
                "
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-2xl bg-[#E10600]/10 border border-[#E10600]/25">
                    <Icon className="w-10 h-10 text-[#E10600]" />
                  </div>

                  <p className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">
                    {stat.value}
                  </p>

                  <p className="text-white/70 font-bold text-sm sm:text-base uppercase tracking-widest">
                    {stat.label}
                  </p>

                  {/* Línea roja sutil */}
                  <div className="h-1 w-14 rounded-full bg-[#E10600]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BannerInfo;
