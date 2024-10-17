import React from "react";
import { BsTag } from "react-icons/bs";
import { FaCar } from "react-icons/fa6";
import ImageArticlesSlider from "./ImageArticlesSlider";
import StripeStock from "@/app/components/Catalogue/components/Articles/components/StripeStock";

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
      {/* <StripeStock articleId={article.id} /> */}
      <div className="p-4 h-24">
        <p className="text-xs text-gray-500 mb-2 font-semibold">{article.id}</p>
        <p className="text-xs text-gray-500 mb-2">{article.description}</p>
      </div>
    </div>
  );
};

export default CardArticles;
