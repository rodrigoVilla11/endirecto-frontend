'use client'
import React, { useState, useEffect, useRef } from "react";
import CardArticles from "./components/CardArticles";

const SliderArticles = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);

  const totalSlides = 8; // Total de tarjetas
  const visibleSlides = 3; // Número de tarjetas visibles a la vez

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) =>
      prevSlide === 0 ? totalSlides - 1 : prevSlide - 1
    );
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 3000); // Cambia de slide cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden w-full">
      <div
        ref={sliderRef}
        className="flex transition-transform duration-1000 gap-10 p-10"
        style={{ transform: `translateX(-${(currentSlide / totalSlides) * 100}%)` }}
        id='articles'
      >
        <CardArticles />
        <CardArticles />
        <CardArticles />
        <CardArticles />
        <CardArticles />
        <CardArticles />
        <CardArticles />
        <CardArticles />
      </div>
      <button
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white p-2"
        onClick={prevSlide}
      >
        Prev
      </button>
      <button
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white p-2"
        onClick={nextSlide}
      >
        Next
      </button>
    </div>
  );
};

export default SliderArticles;
