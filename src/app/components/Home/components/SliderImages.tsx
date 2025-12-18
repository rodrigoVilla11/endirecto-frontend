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
  const { data: marketing, error, isLoading } =
    useGetAllMarketingByFilterQuery({ filterBy });
  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path) router.push(path);
  };

  // UI states (brand)
  if (isLoading)
    return (
      <div className="flex items-center justify-center h-96 w-full bg-[#0B0B0B] border-b-4 border-[#E10600] mt-24 sm:mt-0">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-white/30 border-t-[#E10600] rounded-full animate-spin mb-4" />
          <p className="text-white/70 font-semibold">{t("loading")}</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-96 w-full bg-[#0B0B0B] border-b-4 border-[#E10600] mt-24 sm:mt-0">
        <div className="text-center p-6 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur">
          <span className="text-5xl mb-4 block">⚠️</span>
          <p className="text-white font-bold">{t("errorLoadingData")}</p>
          <p className="text-white/60 text-sm mt-2">
            {t("tryAgainLater") || "Probá de nuevo en unos minutos."}
          </p>
        </div>
      </div>
    );

  if (!marketing || marketing.length === 0)
    return (
      <div className="flex items-center justify-center h-96 w-full bg-[#0B0B0B] border-b-4 border-[#E10600] mt-24 sm:mt-0">
        <div className="text-center p-6 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur">
          <span className="text-5xl mb-4 block">📭</span>
          <p className="text-white font-bold">{t("noDataAvailable")}</p>
        </div>
      </div>
    );

  return (
    <div
      id="home"
      className="relative w-full overflow-hidden shadow-2xl bg-[#0B0B0B] mb-8 sm:mt-0 sm:mb-0 mt-24"
    >
      {/* Glow rojo sutil arriba (marca) */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] bg-[#E10600] opacity-20 rounded-full blur-3xl z-10" />

      <Swiper
        modules={[Navigation, Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
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
                onClick={() => item.headers.url && handleRedirect(item.headers.url)}
                className="cursor-pointer group relative"
              >
                <img
                  src={item.headers.homeWeb}
                  alt={`Banner for ${item._id}`}
                  className="w-full h-full object-contain transition-transform duration-500"
                />

                {/* Overlay fijo para contraste (siempre se ve bien) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

                {/* Overlay hover extra */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Línea roja de marca abajo */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E10600] opacity-90" />
              </SwiperSlide>
            )
        )}
      </Swiper>

      {/* Si querés, acá podés customizar el progressbar a rojo via CSS global */}
    </div>
  );
};

export default SliderImages;
