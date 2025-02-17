"use client";
import { useGetAllMarketingByFilterQuery } from "@/redux/services/marketingApi";
import React from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
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
      <div className="flex items-center justify-center h-80">
        {t("loading")}
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-80">
        {t("errorLoadingData")}
      </div>
    );
  if (!marketing || marketing.length === 0)
    return (
      <div className="flex items-center justify-center h-80">
        {t("noDataAvailable")}
      </div>
    );
  return (
    <div
      className="relative w-full overflow-hidden shadow-lg bg-gray-200 mt-20 mb-8 sm:mt-0 sm:mb-0"
      id="home"
    >
      <Swiper
        modules={[Navigation, Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{
          clickable: true,
          type: "progressbar",
        }}
        autoplay={{ delay: 5000 }}
        loop
      >
        {marketing.map(
          (item) =>
            item.headers?.homeWeb && (
              <SwiperSlide
                key={item._id}
                onClick={() =>
                  item.headers.url && handleRedirect(item.headers.url)
                }
              >
                <img
                  src={item.headers.homeWeb}
                  alt={`Banner for ${item._id}`}
                  className="w-full h-full object-cover cursor-pointer"
                />
              </SwiperSlide>
            )
        )}
      </Swiper>
    </div>
  );
};

export default SliderImages;
