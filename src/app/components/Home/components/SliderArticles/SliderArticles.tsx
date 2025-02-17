"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
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
      <div className="flex justify-center items-center h-64">
        {t("loadingArticles")}
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-64">
        {t("errorLoadingArticles")}
      </div>
    );
  if (!data || data.totalItems === 0)
    return (
      <div className="flex justify-center items-center h-64">
        {t("noArticlesAvailable")}
      </div>
    );

  return (
    <div className="w-full m-10 px-4" id="articles">
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={4}
        slidesPerView={isMobile ? 2 : 5}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop
      >
        {data.articles.map((article: any) => (
          <SwiperSlide key={article.id}>
            <CardArticles article={article} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SliderArticles;
