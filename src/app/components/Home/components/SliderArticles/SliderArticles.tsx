"use client"
// Importaciones necesarias
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import CardArticles from './components/CardArticles';
import { useGetArticlesQuery } from '@/redux/services/articlesApi';

const SliderArticles = () => {
  const { data, error, isLoading } = useGetArticlesQuery({ page: 1, limit: 10 });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        Cargando artículos...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-64">
        Error al cargar los artículos.
      </div>
    );
  if (!data || data.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        No hay artículos disponibles.
      </div>
    );

  return (
    <div className="w-full m-10 px-4">
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={4} // Espaciado entre slides
        slidesPerView={5} // Cantidad de slides visibles
        navigation // Habilita flechas
        pagination={{ clickable: true }} // Habilita paginación
        autoplay={{ delay: 5000 }} // Autoplay cada 5 segundos
        loop // Habilita loop infinito
      >
        {data.map((article : any) => (
          <SwiperSlide key={article.id}>
            <CardArticles article={article} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SliderArticles;
