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
      <section
        className="w-full py-16 bg-[#0B0B0B] border-y border-white/10"
        id="articles"
      >
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block w-12 h-12 border-4 border-white/20 border-t-[#E10600] rounded-full animate-spin mb-4" />
          <p className="text-white/70 font-semibold">{t("loadingArticles")}</p>
        </div>
      </section>
    );

  if (error)
    return (
      <section
        className="w-full py-16 bg-[#0B0B0B] border-y border-white/10"
        id="articles"
      >
        <div className="container mx-auto px-4">
          <div className="text-center p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur shadow-xl">
            <span className="text-5xl mb-4 block">⚠️</span>
            <p className="text-white font-bold">{t("errorLoadingArticles")}</p>
            <p className="text-white/60 text-sm mt-2">
              {t("tryAgainLater") || "Probá de nuevo en unos minutos."}
            </p>
          </div>
        </div>
      </section>
    );

  if (!data || data.totalItems === 0)
    return (
      <section
        className="w-full py-16 bg-[#0B0B0B] border-y border-white/10"
        id="articles"
      >
        <div className="container mx-auto px-4">
          <div className="text-center p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur shadow-xl">
            <span className="text-5xl mb-4 block">📦</span>
            <p className="text-white font-bold">{t("noArticlesAvailable")}</p>
          </div>
        </div>
      </section>
    );

  return (
    <section
      id="articles"
      className="w-full py-16 bg-[#0B0B0B] relative overflow-hidden"
    >
      {/* Glow rojo sutil */}
      <div className="absolute -top-48 -left-48 w-[560px] h-[560px] bg-[#E10600] opacity-15 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            🛍️ {t("featuredProducts") || "Productos Destacados"}
            <span className="text-[#E10600]">.</span>
          </h2>
        </div>

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
    </section>
  );
};

export default SliderArticles;
