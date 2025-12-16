import React from "react";

const ImageArticlesSlider = ({ img }: any) => {
  return (
    <div
      className="
        flex justify-center items-center
        mb-4 p-4
        bg-white/5 backdrop-blur
        border border-white/10
        rounded-2xl
        relative
      "
    >
      <img
        className="w-32 h-32 sm:h-40 object-contain"
        src={img}
        alt="Artículo"
      />

      {/* Acento rojo sutil */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E10600] opacity-80 rounded-b-2xl" />
    </div>
  );
};

export default ImageArticlesSlider;
