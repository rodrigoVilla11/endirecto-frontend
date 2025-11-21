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
      prevIndex === 0 ? img.length - 1 : prevIndex - 1
    );
  };

  if (!img || img.length === 0) {
    return (
      <div className="flex justify-center items-center bg-white">
        <img
          className={`w-full object-contain ${isMobile ? 'h-32' : 'h-44'}`}
          src={defaultImage}
          alt={t("notAvailable")}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full mx-auto">
      <div className="flex justify-center items-center bg-white">
        <img
          className={`w-full object-contain ${isMobile ? 'h-20' : 'h-32'}`}
          src={img[currentIndex]}
          alt={t("articleImageAlt", { number: currentIndex + 1 })}
        />
      </div>

      {img.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className={`absolute left-1 top-1/2 transform -translate-y-1/2 bg-white/80 text-black rounded-full ${
              isMobile ? 'p-1 text-xs' : 'p-2'
            } shadow-md hover:scale-110 transition z-20`}
          >
            ❮
          </button>

          <button
            onClick={handleNext}
            className={`absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/80 text-black rounded-full ${
              isMobile ? 'p-1 text-xs' : 'p-2'
            } shadow-md hover:scale-110 transition z-20`}
          >
            ❯
          </button>
        </>
      )}
    </div>
  );
};

export default ArticleImageSlider;