import React from "react";

interface ArticleImageProps {
  img: any;
}

const ArticleImage: React.FC<ArticleImageProps> = ({ img }) => {
  return (
    <div
      className="
      flex justify-center items-center
      mb-4 p-4
      bg-white backdrop-blur
      border border-white/10
      rounded-2xl
      relative mt-8
    "
    >
      <img className="w-32 h-40 object-contain " src={img} alt="Artículo" />

      {/* Acento de marca */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#E10600] opacity-80 rounded-b-2xl" />
    </div>
  );
};

export default ArticleImage;
