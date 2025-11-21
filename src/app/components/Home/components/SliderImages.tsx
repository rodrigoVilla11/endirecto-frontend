"use client";
import { useGetAllMarketingByFilterQuery } from "@/redux/services/marketingApi";
import React from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { useTranslation } from "react-i18next";

const SliderImages = () => {
  const { t } = useTranslation();
  const filterBy = "headers";
  const { data: marketing, error, isLoading } = useGetAllMarketingByFilterQuery({ filterBy });
  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-96 w-full bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-semibold">{t("loading")}</p>
        </div>
      </div>
    );
    
  if (error)
    return (
      <div className="flex items-center justify-center h-96 w-full bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center p-6 bg-white rounded-2xl shadow-xl">
          <span className="text-5xl mb-4 block">⚠️</span>
          <p className="text-red-700 font-bold">{t("errorLoadingData")}</p>
        </div>
      </div>
    );
    
  if (!marketing || marketing.length === 0)
    return (
      <div className="flex items-center justify-center h-96 w-full bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-center p-6 bg-white rounded-2xl shadow-xl">
          <span className="text-5xl mb-4 block">📭</span>
          <p className="text-gray-700 font-bold">{t("noDataAvailable")}</p>
        </div>
      </div>
    );
    
  return (
    <div
      className="relative w-full overflow-hidden shadow-2xl bg-gray-900 mb-8 sm:mt-0 sm:mb-0 mt-24"
      id="home"
    >
      <Swiper
        modules={[Navigation, Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        pagination={{
          clickable: true,
          type: "progressbar",
        }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop
        className="h-[400px] sm:h-[600px]"
      >
        {marketing.map(
          (item) =>
            item.headers?.homeWeb && (
              <SwiperSlide
                key={item._id}
                onClick={() =>
                  item.headers.url && handleRedirect(item.headers.url)
                }
                className="cursor-pointer group"
              >
                <img
                  src={item.headers.homeWeb}
                  alt={`Banner for ${item._id}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </SwiperSlide>
            )
        )}
      </Swiper>
    </div>
  );
};

export default SliderImages;