import React, { useState } from 'react';

interface ArticleImageProps {
  img: string[]; // Array de URLs de imágenes
}

const ArticleImageSlider: React.FC<ArticleImageProps> = ({ img }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Imagen predeterminada para mostrar cuando no hay imágenes
  const defaultImage = "http://res.cloudinary.com/dw3folb8p/image/upload/v1735595292/wgrcaa3fcibzyvykozd9.png"; // Reemplaza con la URL o ruta de tu imagen de "Foto no disponible"

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % img.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? img.length - 1 : prevIndex - 1
    );
  };

  // Si no hay imágenes en el array, mostrar solo la imagen predeterminada
  if (!img || img.length === 0) {
    return (
      <div className="flex justify-center items-center bg-white">
        <img
          className="w-full h-64 object-contain"
          src={defaultImage}
          alt="No disponible"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Imagen actual */}
      <div className="flex justify-center items-center bg-white">
        <img
          className="w-full h-64 object-contain"
          src={img[currentIndex]}
          alt={`Artículo ${currentIndex + 1}`}
        />
      </div>

      {/* Botones y puntos solo si hay más de una imagen */}
      {img.length > 1 && (
        <>
          {/* Botón anterior */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white text-black rounded-full p-2 shadow-md hover:scale-110 transition"
          >
            ❮
          </button>

          {/* Botón siguiente */}
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-black rounded-full p-2 shadow-md hover:scale-110 transition"
          >
            ❯
          </button>
        </>
      )}
    </div>
  );
};

export default ArticleImageSlider;
