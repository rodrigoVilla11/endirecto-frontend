import React from "react";
import { BsTag } from "react-icons/bs";
import { FaCar } from "react-icons/fa6";
import ImageArticlesSlider from "./ImageArticlesSlider";

const CardArticles = ({ article, handleRedirect }: any) => {
  return (
    <div
      className="h-90 w-56 shadow-2xl rounded-md m-2"
      onClick={() => handleRedirect()}
    >
      <div className="h-6 flex justify-end items-center gap-2 px-2 text-secondary">
        <BsTag />
        <FaCar />
      </div>
      <ImageArticlesSlider img={article.images ? article.images[0] : ""} />
      <div className="p-2 bg-gray-200">
        <h3 className="text-sm">{article.name}</h3>
        <p className="text-xs text-secondary pt-6">{article.description}</p>
      </div>
    </div>
  );
};

export default CardArticles;
