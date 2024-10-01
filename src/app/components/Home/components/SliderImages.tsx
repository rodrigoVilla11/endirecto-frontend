"use client";
import { useGetMarketingByFilterQuery } from '@/redux/services/marketingApi';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SliderImages = () => {
  const filterBy = "headers";
  const {
    data: marketing,
    error,
    isLoading,
  } = useGetMarketingByFilterQuery({ filterBy });
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading) return <div className="flex items-center justify-center h-80">Cargando...</div>;
  if (error) return <div className="flex items-center justify-center h-80">Error al cargar los datos.</div>;
  if (!marketing || marketing.length === 0) return <div className="flex items-center justify-center h-80">No hay datos disponibles.</div>;

  const nextSlide = () => setCurrentIndex((prevIndex) => (prevIndex + 1) % marketing.length);
  const prevSlide = () => setCurrentIndex((prevIndex) => (prevIndex - 1 + marketing.length) % marketing.length);

  return (
    <div className="relative w-full h-80 overflow-hidden pt-4" id="home">
      <div className="absolute inset-0 flex items-center justify-between z-10">
        <button onClick={prevSlide} className="bg-black bg-opacity-50 text-white p-2 rounded-r-full hover:bg-opacity-75 transition ml-4">
          <ChevronLeft size={24} />
        </button>
        <button onClick={nextSlide} className="bg-black bg-opacity-50 text-white p-2 rounded-l-full hover:bg-opacity-75 transition mr-4">
          <ChevronRight size={24} />
        </button>
      </div>
      <div className="relative w-full h-full">
        {marketing.map((item, index) => (
          item.headers?.homeWeb && (
            <div
              key={item._id}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ zIndex: index === currentIndex ? 1 : 0 }}
            >
              <img
                src={item.headers.homeWeb}
                alt={`Banner for ${item._id}`}
                className="w-full h-full object-contain"
              />
            </div>
          )
        ))}
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
        {marketing.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`mx-1 w-3 h-3 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default SliderImages;