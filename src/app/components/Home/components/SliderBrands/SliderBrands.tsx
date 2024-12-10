'use client';
import React from "react";
import BrandsCards from "./components/BrandsCards";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useAuth } from "@/app/context/AuthContext";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";

const SliderBrands = () => {
  const { isAuthenticated } = useAuth();
  const { data: brands, isLoading, error } = useGetBrandsQuery(null);

  // Filtrar las marcas visibles (hidden: false)
  const visibleBrands = brands?.filter((brand) => !brand.hidden) || [];

  // Procesar los datos de marcas visibles
  const logos = visibleBrands.map((brand) => ({
    id: brand.id,
    brand: brand.name,
    logo: brand.images, // Se asume que brand.images es un string (URL)
  }));

  // Manejo de estados de carga y error
  if (isLoading) {
    return <div className="text-center py-4">Cargando marcas...</div>;
  }

  if (error) {
    return <div className="text-center py-4">Error al cargar marcas</div>;
  }

  if (!logos.length) {
    return <div className="text-center py-4">No hay marcas disponibles</div>;
  }

  return (
    <div className="w-full p-4" id="brands">
      <Swiper
        modules={[Navigation, Autoplay]} // Módulos necesarios
        spaceBetween={16} // Espacio entre slides
        slidesPerView={6} // Cantidad de slides visibles
        navigation // Habilita navegación (flechas)
        autoplay={{ delay: 5000 }} // Habilita autoplay con 5 segundos de intervalo
        loop // Loop infinito
        centeredSlides={false} // No centra los slides
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
