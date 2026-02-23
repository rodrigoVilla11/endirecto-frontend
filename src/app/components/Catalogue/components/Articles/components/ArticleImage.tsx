"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMobile } from "@/app/context/ResponsiveContext";

interface ArticleImageProps {
  img: string[];
}

const ArticleImageSlider: React.FC<ArticleImageProps> = ({ img }) => {
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const [currentIndex, setCurrentIndex] = useState(0);

  const defaultImage =
    "http://res.cloudinary.com/dw3folb8p/image/upload/v1735595292/wgrcaa3fcibzyvykozd9.png";

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % img.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? img.length - 1 : prevIndex - 1,
    );
  };

  if (!img || img.length === 0) {
    return (
      <div className="flex justify-center items-center bg-white/5 backdrop-blur border border-white/10 rounded-2xl">
        <img
          className={`w-full object-contain ${isMobile ? "h-32" : "h-44"} p-2`}
          src={defaultImage}
          alt={t("notAvailable")}
        />
        {/* acento marca */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E10600] opacity-80 rounded-b-2xl" />
      </div>
    );
  }

  return (
    <div className="relative w-full mx-auto">
      {/* Contenedor imagen */}
      <div className="flex justify-center items-center bg-white">
        <img
          className={`w-full object-contain ${isMobile ? "h-20" : "h-32"}`}
          src={img[currentIndex]}
          alt={t("articleImageAlt", { number: currentIndex + 1 })}
        />
      </div>
      {/* Flechas */}
      {img.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label={t("previous")}
            className={`
            absolute left-2 top-1/2 -translate-y-1/2
            flex items-center justify-center
            rounded-full
            bg-white/10 backdrop-blur
            border border-white/20
            text-black
            ${isMobile ? "p-1 text-xs" : "p-2 text-sm"}
            shadow-lg
            hover:bg-[#E10600] hover:border-[#E10600]
            hover:scale-110
            transition z-20
          `}
          >
            ❮
          </button>

          <button
            onClick={handleNext}
            aria-label={t("next")}
            className={`
            absolute right-2 top-1/2 -translate-y-1/2
            flex items-center justify-center
            rounded-full
            bg-white/10 backdrop-blur
            border border-white/20
            text-black
            ${isMobile ? "p-1 text-xs" : "p-2 text-sm"}
            shadow-lg
            hover:bg-[#E10600] hover:border-[#E10600]
            hover:scale-110
            transition z-20
          `}
          >
            ❯
          </button>
        </>
      )}
    </div>
  );
};

export default ArticleImageSlider;
