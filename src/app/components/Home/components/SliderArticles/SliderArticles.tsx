'use client'
import React, { useState, useEffect, useRef } from "react";
import CardArticles from "./components/CardArticles";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from "next/navigation";

const SliderArticles = () => {
  const { data, error, isLoading } = useGetArticlesQuery({ page: 1, limit: 10 });
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const articles = data ? [...data, ...data] : [];
  const totalSlides = articles.length; 
  const visibleSlides = 2; 


  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === 0 ? totalSlides - 1 : prevSlide - 1));
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  if (isLoading) return <div className="flex justify-center items-center h-64">Cargando artículos...</div>;
  if (error) return <div className="flex justify-center items-center h-64">Error al cargar los artículos.</div>;
  if (!data || data.length === 0) return <div className="flex justify-center items-center h-64">No hay artículos disponibles.</div>;

  return (
    <div className="relative overflow-hidden w-full p-10" id='articles'>
      <div
        ref={sliderRef}
        className="flex transition-transform duration-1000 gap-4"
        style={{ transform: `translateX(-${(currentSlide % (totalSlides / 2)) * (100 / visibleSlides)}%)` }}
      >
        {articles.map((article, index) => (
          <div key={article.id || index} className="flex-none w-56"> 
            <CardArticles article={article} />
          </div>
        ))}
      </div>
      <button
        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full hover:bg-opacity-75 transition"
        onClick={prevSlide}
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full hover:bg-opacity-75 transition"
        onClick={nextSlide}
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};

export default SliderArticles;
