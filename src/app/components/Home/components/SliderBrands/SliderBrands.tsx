'use client'
import React, { useState, useEffect, useRef } from "react";
import BrandsCards from './components/BrandsCards';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetBrandsQuery } from "@/redux/services/brandsApi";

const SliderBrands = () => {
  const { data: brands } = useGetBrandsQuery(null);

  const logos = brands?.length
    ? brands.flatMap(brand => brand.images.map(image => ({ brand: brand.name, logo: image })))
    : [];

  const duplicatedLogos = [...logos, ...logos];

  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const totalSlides = duplicatedLogos.length; 
  const visibleSlides = 6; 

  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

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

  useEffect(() => {
    if (sliderRef.current) {
      if (currentSlide === totalSlides / 2) {
        sliderRef.current.style.transition = 'none';
        setCurrentSlide(0);
      }
    }
  }, [currentSlide, totalSlides]);

  return (
    <div className="relative overflow-hidden w-full p-4" id="brands">
      <div
        ref={sliderRef}
        className="flex transition-transform duration-1000 gap-4"
        style={{ transform: `translateX(-${(currentSlide % (totalSlides / 2)) * (100 / visibleSlides)}%)` }}
      >
        {duplicatedLogos.map((logo, index) => (
          <div key={index} className="flex-none w-40">
            <BrandsCards logo={logo.logo} brand={logo.brand} handleRedirect={handleRedirect} />
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

export default SliderBrands;
