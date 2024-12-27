"use client";
import React, { useState } from "react";
import ArticleName from "./Articles/components/ArticleName";
import { useRouter } from "next/navigation";
import { useArticleId } from "@/app/context/AritlceIdContext";
import { useClient } from "@/app/context/ClientContext";

const CardSearch = ({ article, setSearchQuery }: any) => {
  const { selectedClientId } = useClient();

  const { setArticleId } = useArticleId();

  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path) {
      setArticleId(article.id);
      router.push(path);
      setSearchQuery("")
    }
  };
  return (
    <div
      key={article.id}
      className="relative w-44 max-w-xs"
      onClick={() => handleRedirect(`/catalogue`)}
    >
      {/* Contenido del artículo */}
      <div key={article.id} className="relative flex flex-col justify-center items-center shadow-lg bg-white cursor-pointer rounded-lg hover:shadow-xl transition-all duration-300">
        <img
          src={article.images ? article.images[0] : ""}
          alt={article.name}
          className="w-32 h-40 object-contain rounded-lg"
        />
        <div className="bg-gray-100 px-4 py-2 w-full text-center rounded-lg">
          <ArticleName name={article.name} id={article.id} noName={true} />
        </div>
      </div>
    </div>
  );
};

export default CardSearch;
