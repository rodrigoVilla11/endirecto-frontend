"use client";
import React, { useState } from "react";
import StripeStock from "./StripeStock";
import ArticleName from "./ArticleName";
import ArticleImage from "./ArticleImage";
import ArticleMenu from "./ArticleMenu";
import CostPrice from "./CostPrice";
import SuggestedPrice from "./SuggestedPrice";
import AddToCart from "./AddToCart";
import Modal from "@/app/components/components/Modal";
import Description from "./Description/Description";
import { IoMdClose } from "react-icons/io";

const CardArticles = ({ article }: any) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);
  return (
    <div>
      <div className="h-116 w-68 bg-white rounded-sm" onClick={openModal}>
        <ArticleMenu />
        <ArticleImage img={article.image}/>
        <StripeStock articleId={article.id} />
        <ArticleName name={article.name} id={article.id}/>
        <CostPrice articleId={article.id}/>
        <hr />
        <SuggestedPrice articleId={article.id}/>
        <AddToCart articleId={article.id}/>
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="flex justify-between">
          <h2 className="text-lg mb-4">Article Details</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
          >
            <IoMdClose />
          </button>
        </div>
        <div className="flex gap-4">
          <div
            className="h-116 w-72 bg-white rounded-sm border border-black"
            onClick={openModal}
          >
            <ArticleMenu />
            <ArticleImage img={article.image}/>
            <StripeStock articleId={article.id}  />
            <ArticleName name={article.name} id={article.id}/>
            <CostPrice articleId={article.id} />
            <hr />
            <SuggestedPrice articleId={article.id} />
            <AddToCart articleId={article.id} />
          </div>
          <Description article={article} description={article.description}/>
        </div>
      </Modal>
    </div>
  );
};

export default CardArticles;
