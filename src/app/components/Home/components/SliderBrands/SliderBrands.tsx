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

  // Procesar los datos de marcas visibles
  const logos = brands?.map((brand) => ({
    id: brand.id,
    brand: brand.name,
    logo: brand.images, // Se asume que brand.images es un string (URL)
  }));

  // Manejo de estados de carga y error
  if (isLoading) {
    return <div className="text-center py-4">{t("loadingBrands")}</div>;
  }

  if (error) {
    return <div className="text-center py-4">{t("errorLoadingBrands")}</div>;
  }

  if (!logos?.length) {
    return <div className="text-center py-4">{t("noBrandsAvailable")}</div>;
  }

  return (
    <div className="w-full p-4 flex justify-center items-center" id="brands">
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={16}
        slidesPerView={isMobile ? 3 : 6}
        autoplay={{ delay: 5000 }}
        loop
        centeredSlides={false}
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
  );
};

export default SliderBrands;
