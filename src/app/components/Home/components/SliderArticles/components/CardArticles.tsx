import React, { useState } from "react";
import { BsTag } from "react-icons/bs";
import { FaCar } from "react-icons/fa6";
import ImageArticlesSlider from "./ImageArticlesSlider";
import StripeStock from "@/app/components/Catalogue/components/Articles/components/StripeStock";
import { useAuth } from "@/app/context/AuthContext";
import { useArticleId } from "@/app/context/AritlceIdContext";
import { useRouter } from "next/navigation";

const CardArticles = ({ article }: any) => {
  const { isAuthenticated } = useAuth();
  const encodedId = encodeURIComponent(article.id);
  
  const {setArticleId} = useArticleId();

  
  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
      setArticleId(article.id);
    }
  };
  return (
    <div
      className="h-90 w-56 shadow-2xl rounded-md m-2"
      onClick={() => handleRedirect(`/catalogues`)}
    >
      <div className="h-6 flex justify-end items-center gap-2 px-2 text-secondary">
        <BsTag />
        <FaCar />
      </div>
      <ImageArticlesSlider img={article.images ? article.images[0] : ""} />
      {isAuthenticated && <StripeStock articleId={article.id} />}
      <div className="p-4 h-24">
        <p className="text-xs text-gray-500 mb-2 font-semibold">{article.id}</p>
        <p className="text-xs text-gray-500 mb-2">{article.description}</p>
      </div>
    </div>
  );
};

export default CardArticles;
