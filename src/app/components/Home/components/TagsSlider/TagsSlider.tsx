"use client";
import React from "react";
import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";
import ButtonsImage from "./ButtonsImage";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useTranslation } from "react-i18next";

const SliderTags = () => {
  const { t } = useTranslation();
  const filterBy = "tags";
  const { data: marketing } = useGetMarketingByFilterQuery({ filterBy });
  const { isMobile } = useMobile();

  const logos = marketing?.length
    ? marketing.map((tag) => ({
        id: tag._id,
        tag: tag.tags.name,
        logo: tag.tags.image,
      }))
    : [];

  if (logos.length === 0) {
    return (
      <section className="w-full py-16 bg-[#0B0B0B] border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur shadow-xl">
            <span className="text-5xl mb-4 block">🏷️</span>
            <p className="text-white font-bold">{t("noDataAvailable")}</p>
            <p className="text-white/60 text-sm mt-2">
              {t("tryAgainLater") || "Probá de nuevo más tarde."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="tags" className="w-full py-16 bg-[#0B0B0B] relative overflow-hidden">
      {/* Glow rojo sutil */}
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-[#E10600] opacity-15 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            🎯 {t("featuredCategories") || "Categorías Destacadas"}
            <span className="text-[#E10600]">.</span>
          </h2>
        </div>

        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"} gap-6`}>
          {logos.slice(0, 4).map((logo) => (
            <div
              key={logo.id}
              className="
                rounded-3xl overflow-hidden
                bg-white/5 border border-white/10
                shadow-xl backdrop-blur
                hover:border-[#E10600]/40 hover:shadow-2xl
                transition-all duration-300
                transform hover:scale-[1.02]
              "
            >
              {/* Te conviene que ButtonsImage tenga fondo transparente o use bg-white/0 */}
              <ButtonsImage logo={logo.logo} name={logo.tag} />

              {/* barrita roja abajo para “marca” */}
              <div className="h-1 w-full bg-[#E10600] opacity-90" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SliderTags;
