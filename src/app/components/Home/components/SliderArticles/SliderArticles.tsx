'use client'
import React, { useState, useEffect, useRef } from "react";
import CardArticles from "./components/CardArticles";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SliderArticles = () => {
  const { data, error, isLoading } = useGetArticlesQuery({ page: 1, limit: 10 });
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);

  const totalSlides = data?.length || 0;
  const visibleSlides = 4; // Ajustado para mostrar 4 tarjetas a la vez

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % Math.max(totalSlides - visibleSlides + 1, 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) =>
      prevSlide === 0 ? Math.max(totalSlides - visibleSlides, 0) : prevSlide - 1
    );
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  if (isLoading) return <div className="flex justify-center items-center h-64">Cargando artículos...</div>;
  if (error) return <div className="flex justify-center items-center h-64">Error al cargar los artículos.</div>;
  if (!data || data.length === 0) return <div className="flex justify-center items-center h-64">No hay artículos disponibles.</div>;

  return (
    <div className="relative overflow-hidden w-full p-4" id='articles'>
      <div
        ref={sliderRef}
        className="flex transition-transform duration-1000 gap-4"
        style={{ transform: `translateX(-${currentSlide * (100 / visibleSlides)}%)` }}
      >
        {data.map((article, index) => (
          <div key={article.id || index} className="flex-none w-56">
            <CardArticles article={article} />
          </div>
        ))}
      </div>
      <button
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
        onClick={prevSlide}
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
        onClick={nextSlide}
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};

export default SliderArticles;