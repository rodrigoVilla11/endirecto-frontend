"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface ArticleImageProps {
  img: string[]; // Array de URLs de imágenes
}

const ArticleImageSlider: React.FC<ArticleImageProps> = ({ img }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Imagen predeterminada para mostrar cuando no hay imágenes
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

  // Si no hay imágenes, muestra solo la imagen predeterminada
  if (!img || img.length === 0) {
    return (
      <div className="flex justify-center items-center bg-white pt-2 px-4">
        <img
          className="w-full h-44 object-contain"
          src={defaultImage}
          alt={t("notAvailable")}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto pt-2 px-4">
      {/* Imagen actual */}
      <div className="flex justify-center h-48 items-center bg-white">
        <img
          className="w-full h-44 object-contain"
          src={img[currentIndex]}
          alt={t("articleImageAlt", { number: currentIndex + 1 })}
        />
      </div>

      {/* Botones solo si hay más de una imagen */}
      {img.length > 1 && (
        <>
          {/* Botón anterior */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white text-black rounded-full p-2 shadow-md hover:scale-110 transition z-20"
          >
            ❮
          </button>

          {/* Botón siguiente */}
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-black rounded-full p-2 shadow-md hover:scale-110 transition z-20"
          >
            ❯
          </button>
        </>
      )}
    </div>
  );
};

export default ArticleImageSlider;
