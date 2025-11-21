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

  const logos = brands?.map((brand) => ({
    id: brand.id,
    brand: brand.name,
    logo: brand.images,
  }));

  if (isLoading) {
    return (
      <div className="w-full py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-semibold">{t("loadingBrands")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-16 bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center p-6">
          <span className="text-5xl mb-4 block">⚠️</span>
          <p className="text-red-700 font-bold">{t("errorLoadingBrands")}</p>
        </div>
      </div>
    );
  }

  if (!logos?.length) {
    return (
      <div className="w-full py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-6">
          <span className="text-5xl mb-4 block">🏷️</span>
          <p className="text-gray-700 font-bold">{t("noBrandsAvailable")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-16 bg-gradient-to-br from-white to-gray-50" id="brands">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          🏷️ {t("ourBrands") || "Nuestras Marcas"}
        </h2>
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
              <BrandsCards
                logo={logo.logo}
                name={logo.brand}
                id={logo.id}
                isAuthenticated={isAuthenticated}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default SliderBrands;