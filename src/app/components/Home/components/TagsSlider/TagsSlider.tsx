"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";
import ButtonsImage from "./ButtonsImage";
const SliderTags = () => {
  const filterBy = "tags";
  const { data: marketing } = useGetMarketingByFilterQuery({ filterBy });

  

  const logos = marketing?.length
    ? marketing.map((tag) => ({
        id: tag._id,
        tag: tag.tags.name,
        logo: tag.tags.image,
      }))
    : [];

  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const totalSlides = logos.length;
  const visibleSlides = 6;

  const nextSlide = () => {
    setCurrentSlide((prevSlide) =>
      prevSlide + visibleSlides >= totalSlides ? 0 : prevSlide + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) =>
      prevSlide === 0 ? totalSlides - visibleSlides : prevSlide - 1
    );
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  return (
    <div className="relative overflow-hidden w-full p-4" id="tags">
      <div
        ref={sliderRef}
        className="flex transition-transform duration-1000 gap-4"
        style={{
          transform: `translateX(-${
            (currentSlide % totalSlides) * (100 / visibleSlides)
          }%)`,
        }}
      >
        {logos.map((logo, index) => (
          <div key={index} className="w-72 h-24">
            <ButtonsImage
              logo={logo.logo}
              name={logo.tag}
            />
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

export default SliderTags;
