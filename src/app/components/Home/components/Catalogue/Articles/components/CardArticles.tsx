import React, { useEffect, useState } from "react";
import StripeStock from "./StripeStock";
import ArticleName from "./ArticleName";
import ArticleImage from "./ArticleImage";
import Modal from "@/app/components/components/Modal";
import ArticleDetails from "./ArticleDetails";
import { useArticleId } from "@/app/context/AritlceIdContext";
import ArticleMenu from "./ArticleMenu";
import { Eye, ShoppingCart, Heart } from "lucide-react";

interface FormState {
  id: string;
  favourites: string[];
  shopping_cart: string[];
}

const CardArticle = ({ article, showPurchasePrice }: any) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { articleId, setArticleId } = useArticleId(); 

  useEffect(() => {
    if (articleId && articleId === article.id) {
      setModalOpen(true);
      setArticleId(null); 
    }
  }, [articleId, article.id, setArticleId]); 

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <>
      <div 
        className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-200 hover:border-purple-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Menu flotante */}
        <div className="absolute top-4 right-4 z-20">
          <ArticleMenu article={article} />
        </div>

        {/* Imagen del producto */}
        <div 
          className="relative cursor-pointer overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
          onClick={openModal}
        >
          <div className="aspect-square p-6">
            <ArticleImage img={article.images} />
          </div>

          {/* Overlay con botón de vista rápida */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-6 transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-2xl font-bold shadow-xl hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              <Eye className="w-5 h-5" />
              <span>Vista Rápida</span>
            </button>
          </div>

          {/* Badge de stock (si aplica) */}
          <div className="absolute top-4 left-4">
            <StripeStock stock={article.stock} />
          </div>
        </div>

        {/* Información del producto */}
        <div className="p-6 bg-gradient-to-br from-white to-gray-50">
          <div 
            className="cursor-pointer mb-4"
            onClick={openModal}
          >
            <ArticleName name={article.name} id={article.id} />
          </div>

          {/* Código del producto */}
          <div className="mb-3">
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Código: {article.id}
            </span>
          </div>

          {/* Precio */}
          {showPurchasePrice && article.price && (
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  ${article.price.toLocaleString('es-AR')}
                </span>
                {article.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    ${article.originalPrice.toLocaleString('es-AR')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              onClick={openModal}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm">Ver más</span>
            </button>

            <button
              className="p-3 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 rounded-xl transition-all border-2 border-gray-200 hover:border-red-300"
              title="Agregar a favoritos"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Efecto de brillo en hover */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none ${
          isHovered ? 'animate-shine' : ''
        }`} />
      </div>

      {/* Modal de detalles */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ArticleDetails
          closeModal={closeModal}
          article={article}
        />
      </Modal>

      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%) skewX(-15deg);
          }
          100% {
            transform: translateX(200%) skewX(-15deg);
          }
        }
        .animate-shine {
          animation: shine 1.5s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default CardArticle;