import React, { useEffect, useState } from "react";
import StripeStock from "./StripeStock";
import ArticleName from "./ArticleName";
import ArticleImage from "./ArticleImage";
import ArticleMenu from "./ArticleMenu";
import Modal from "@/app/components/components/Modal";
import ArticleDetails from "./ArticleDetails";
import { useArticleId } from "@/app/context/AritlceIdContext";

const ListArticles = ({ article }: any) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { articleId } = useArticleId();

  // Abre el modal si el artículo coincide con el seleccionado
  useEffect(() => {
    if (articleId && articleId === article.id) {
      setModalOpen(true);
    }
  }, [articleId, article.id]);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <div
      className="
      flex items-center justify-between
      bg-white/5 backdrop-blur
      p-4 rounded-2xl
      border border-white/10
      shadow-lg
      hover:border-[#E10600]/40
      transition-all
      mb-4
    "
    >
      {/* Imagen */}
      <div className="flex items-center w-1/6">
        <ArticleImage img={article.images} />
      </div>

      {/* Nombre */}
      <div className="flex-1 ml-4">
        <ArticleName name={article.name} id={article.id} />
      </div>

      {/* Stock */}
      <div className="flex items-center justify-center w-1/6">
        <StripeStock articleId={article.id} />
      </div>

      {/* Menú */}
      <div className="flex items-center justify-end w-1/6">
        <ArticleMenu article={article} />
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ArticleDetails closeModal={closeModal} article={article} />
      </Modal>
    </div>
  );
};

export default ListArticles;
