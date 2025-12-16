"use client";
import React, { useState } from "react";
import ArticleName from "./Articles/components/ArticleName";
import { useRouter } from "next/navigation";
import { useArticleId } from "@/app/context/AritlceIdContext";
import StripeStock from "./Articles/components/StripeStock";

const CardSearch = ({ article, setSearchQuery, handleOpenModal }: any) => {
  const { setArticleId } = useArticleId();

  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
      handleOpenModal(article.id);
    }
  };
  return (
    <div
      className="relative w-36 sm:w-44 max-w-xs"
      onClick={() => handleRedirect(`/catalogue`)}
    >
      <div
        className="
        relative flex flex-col justify-center items-center
        shadow-lg hover:shadow-2xl
        bg-white/5 backdrop-blur-xl
        border border-white/10 hover:border-[#E10600]/40
        cursor-pointer rounded-2xl overflow-hidden
        transition-all duration-300
        hover:scale-[1.02]
      "
      >
        {/* Badge equivalencia */}
        {article.foundEquivalence && (
          <div className="absolute top-2 left-2 bg-[#E10600]/15 border border-[#E10600]/35 text-[#E10600] text-[10px] font-extrabold px-2 py-1 rounded-full z-20">
            EQUIVALENCIA
          </div>
        )}

        {/* Imagen */}
        <div className="w-full bg-black/20">
          <img
            src={article.images ? article.images[0] : ""}
            alt={article.name}
            className="w-32 h-40 sm:w-40 sm:h-44 object-contain mx-auto p-3"
          />
        </div>

        {/* Stock */}
        <div className="w-full">
          <StripeStock articleId={article.id} />
        </div>

        {/* Nombre */}
        <div className="w-full bg-white/5 border-t border-white/10 px-3 py-2 text-center">
          <ArticleName
            name={article.name}
            id={article.id}
            code={article.supplier_code}
            noName={true}
          />
        </div>

        {/* Glow hover */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-[#E10600]/10 via-transparent to-blue-500/10" />
      </div>
    </div>
  );
};

export default CardSearch;
