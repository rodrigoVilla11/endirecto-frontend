"use client";
import React, { useState } from "react";
import ArticleName from "./Articles/components/ArticleName";
import { useRouter } from "next/navigation";
import { useArticleId } from "@/app/context/AritlceIdContext";

const CardSearch = ({ article, setSearchQuery,handleOpenModal }: any) => {
  const { setArticleId } = useArticleId();

  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
      handleOpenModal(article.id)
    }
  };
  return (
    <div
      className="relative w-36 sm:w-44 max-w-xs"
      onClick={() => handleRedirect(`/catalogue`)}
    >
      {/* Contenido del artículo */}
      <div className="relative flex flex-col justify-center items-center shadow-lg bg-white cursor-pointer rounded-lg hover:shadow-xl transition-all duration-300">
        <img
          src={article.images ? article.images[0] : ""}
          alt={article.name}
          className="w-32 h-40 object-contain rounded-lg"
        />
        <div className="bg-gray-100 px-4 py-2 w-full text-center rounded-lg">
          <ArticleName name={article.name} id={article.id} code={article.supplier_code} noName={true} />
        </div>
      </div>
    </div>
  );
};

export default CardSearch;
