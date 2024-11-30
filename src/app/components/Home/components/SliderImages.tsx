"use client";
import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";
import React from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

const SliderImages = () => {
  const filterBy = "headers";
  const {
    data: marketing,
    error,
    isLoading,
  } = useGetMarketingByFilterQuery({ filterBy });
  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-80">Cargando...</div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-80">
        Error al cargar los datos.
      </div>
    );
  if (!marketing || marketing.length === 0)
    return (
      <div className="flex items-center justify-center h-80">
        No hay datos disponibles.
      </div>
    );

  return (
    <div
      className="relative w-full overflow-hidden shadow-lg bg-gray-200"
      id="home"
    >
      <Swiper
        modules={[Navigation, Autoplay, Pagination]} // Autoplay, navegación y paginación
        spaceBetween={0} // Sin espacio entre slides
        slidesPerView={1} // Una diapositiva visible a la vez
        navigation // Flechas de navegación
        pagination={{
          clickable: true,
          type: "progressbar",
        }}
        autoplay={{ delay: 5000 }} // Autoplay cada 5 segundos
        loop // Loop infinito
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
