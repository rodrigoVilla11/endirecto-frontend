import React, { useEffect, useState } from "react";
import StripeStock from "./StripeStock";
import ArticleName from "./ArticleName";
import ArticleImage from "./ArticleImage";
import ArticleMenu from "./ArticleMenu";
import Modal from "@/app/components/components/Modal";
import ArticleDetails from "./ArticleDetails";
import { useArticleId } from "@/app/context/AritlceIdContext";

interface FormState {
  id: string;
  favourites: string[];
  shopping_cart: string[];
}

const CardArticle = ({ article, showPurchasePrice }: any) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { articleId, setArticleId } = useArticleId(); 

  useEffect(() => {
    if (articleId && articleId === article.id) {
      setModalOpen(true);
      setArticleId(null); 
    }
  }, [articleId, article.id]); 

  

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <div className="w-52 h-64 bg-gray-200 m-8">
      <div className="relative bg-white flex flex-col justify-between shadow-lg">
        <ArticleMenu />
        <div onClick={openModal}>
          <ArticleImage img={article.images} />
          <div className="bg-gray-200">
            <ArticleName name={article.name} id={article.id} />
          </div>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ArticleDetails
          closeModal={closeModal}
          article={article}
        />
      </Modal>
    </div>
  );
};

export default CardArticle;
