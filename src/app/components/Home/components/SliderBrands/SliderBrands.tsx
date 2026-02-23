"use client";
import React from "react";
import BrandsCards from "./components/BrandsCards";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useAuth } from "@/app/context/AuthContext";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useTranslation } from "react-i18next";

const SliderBrands = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data: brands, isLoading, error } = useGetBrandsQuery(null);
  const { isMobile } = useMobile();

  const logos =
    brands?.map((brand) => ({
      id: brand.id,
      brand: brand.name,
      logo: brand.images,
    })) || [];

  // Brand UI states
  if (isLoading) {
    return (
      <section className="w-full py-16 bg-[#0B0B0B] border-y border-white/10" id="brands">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block w-12 h-12 border-4 border-white/20 border-t-[#E10600] rounded-full animate-spin mb-4" />
          <p className="text-white/70 font-semibold">{t("loadingBrands")}</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full py-16 bg-[#0B0B0B] border-y border-white/10" id="brands">
        <div className="container mx-auto px-4">
          <div className="text-center p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur shadow-xl">
            <span className="text-5xl mb-4 block">⚠️</span>
            <p className="text-white font-bold">{t("errorLoadingBrands")}</p>
            <p className="text-white/60 text-sm mt-2">
              {t("tryAgainLater") || "Probá de nuevo en unos minutos."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!logos.length) {
    return (
      <section className="w-full py-16 bg-[#0B0B0B] border-y border-white/10" id="brands">
        <div className="container mx-auto px-4">
          <div className="text-center p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur shadow-xl">
            <span className="text-5xl mb-4 block">🏷️</span>
            <p className="text-white font-bold">{t("noBrandsAvailable")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="brands" className="w-full py-16 bg-[#0B0B0B] relative overflow-hidden">
      {/* Glow rojo sutil */}
      <div className="absolute -top-48 -right-48 w-[560px] h-[560px] bg-[#E10600] opacity-15 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            🏷️ {t("ourBrands") || "Nuestras Marcas"}
            <span className="text-[#E10600]">.</span>
          </h2>
  
        </div>

        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={24}
          slidesPerView={isMobile ? 2 : 6}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          loop
          centeredSlides={false}
          className="brands-swiper"
        >
          {logos.map((logo) => (
            <SwiperSlide key={logo.id}>
              <div
                className="
                  rounded-3xl overflow-hidden
                  bg-white/5 border border-white/10
                  hover:border-[#E10600]/40
                  transition-all duration-300
                "
              >
                <BrandsCards
                  logo={logo.logo}
                  name={logo.brand}
                  id={logo.id}
                  isAuthenticated={isAuthenticated}
                />
                {/* Acento marca */}
                <div className="h-1 w-full bg-[#E10600] opacity-90" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default SliderBrands;
