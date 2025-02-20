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
    <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-lg mb-4">
      {/* Imagen del artículo */}
      <div className="flex items-center w-1/6">
        <ArticleImage img={article.images} />
      </div>

      {/* Nombre del artículo */}
      <div className="flex-1 ml-4">
        <ArticleName name={article.name} id={article.id} className="text-lg font-semibold" />
      </div>

      {/* Estado de stock */}
      <div className="flex items-center justify-center w-1/6">
        <StripeStock articleId={article.id} className="text-green-500 text-center" />
      </div>

      {/* Menú del artículo */}
      <div className="flex items-center w-1/6">
        <ArticleMenu article={article}/>
      </div>

      {/* Modal para mostrar detalles del artículo */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ArticleDetails closeModal={closeModal} article={article} />
      </Modal>
    </div>
  );
};

export default ListArticles;
