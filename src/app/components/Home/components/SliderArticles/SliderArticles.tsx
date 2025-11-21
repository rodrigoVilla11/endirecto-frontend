"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";
import CardArticles from "./components/CardArticles";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useTranslation } from "react-i18next";

const SliderArticles = () => {
  const { t } = useTranslation();
  const { data, error, isLoading } = useGetArticlesQuery({
    page: 1,
    limit: 10,
    priceListId: "3",
  });
  const { isMobile } = useMobile();

  if (isLoading)
    return (
      <div className="w-full py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-semibold">{t("loadingArticles")}</p>
        </div>
      </div>
    );
    
  if (error)
    return (
      <div className="w-full py-16 bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center p-6">
          <span className="text-5xl mb-4 block">⚠️</span>
          <p className="text-red-700 font-bold">{t("errorLoadingArticles")}</p>
        </div>
      </div>
    );
    
  if (!data || data.totalItems === 0)
    return (
      <div className="w-full py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-6">
          <span className="text-5xl mb-4 block">📦</span>
          <p className="text-gray-700 font-bold">{t("noArticlesAvailable")}</p>
        </div>
      </div>
    );

  return (
    <div className="w-full py-16 bg-gradient-to-br from-white to-gray-50" id="articles">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          🛍️ {t("featuredProducts") || "Productos Destacados"}
        </h2>
        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={24}
          slidesPerView={isMobile ? 2 : 5}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop
          navigation
          className="articles-swiper"
        >
          {data.articles.map((article: any) => (
            <SwiperSlide key={article.id}>
              <CardArticles article={article} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default SliderArticles;