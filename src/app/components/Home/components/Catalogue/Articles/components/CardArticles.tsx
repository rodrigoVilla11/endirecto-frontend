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
        className="
        group relative
        bg-white/5 backdrop-blur
        rounded-3xl
        shadow-xl hover:shadow-2xl
        transition-all duration-300
        overflow-hidden
        border border-white/10
        hover:border-[#E10600]/40
      "
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Menu flotante */}
        <div className="absolute top-4 right-4 z-20">
          <ArticleMenu article={article} />
        </div>

        {/* Imagen del producto */}
        <div
          className="relative cursor-pointer overflow-hidden bg-white/5"
          onClick={openModal}
        >
          <div className="aspect-square p-6">
            <ArticleImage img={article.images} />
          </div>

          {/* Overlay con botón de vista rápida */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-center pb-6 transition-all duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <button
              onClick={openModal}
              className="
              flex items-center gap-2
              px-6 py-3
              bg-[#E10600] text-white
              rounded-2xl font-extrabold
              shadow-xl
              hover:bg-[#c80500]
              transition-all
              transform hover:scale-105
            "
            >
              <Eye className="w-5 h-5" />
              <span>Vista Rápida</span>
            </button>
          </div>

          {/* Badge de stock */}
          <div className="absolute top-4 left-4">
            <StripeStock stock={article.stock} />
          </div>

          {/* Acento marca */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E10600] opacity-90" />
        </div>

        {/* Información del producto */}
        <div className="p-6 bg-transparent">
          <div className="cursor-pointer mb-4" onClick={openModal}>
            <ArticleName name={article.name} id={article.id} />
          </div>

          {/* Código */}
          <div className="mb-3">
            <span className="text-xs font-semibold text-white/70 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              Código: {article.id}
            </span>
          </div>

          {/* Precio */}
          {showPurchasePrice && article.price && (
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">
                  ${article.price.toLocaleString("es-AR")}
                </span>
                {article.originalPrice && (
                  <span className="text-sm text-white/40 line-through">
                    ${article.originalPrice.toLocaleString("es-AR")}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={openModal}
              className="
              flex-1 flex items-center justify-center gap-2
              px-4 py-3
              bg-[#E10600] text-white
              rounded-2xl font-extrabold
              hover:bg-[#c80500]
              transition-all shadow-lg
              transform hover:scale-[1.02]
            "
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm">Ver más</span>
            </button>

            <button
              className="
              p-3
              bg-white/5 border border-white/10
              text-white/70
              hover:text-white
              hover:bg-white/10
              hover:border-[#E10600]/40
              rounded-2xl transition-all
            "
              title="Agregar a favoritos"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Brillo hover (adaptado a dark) */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${
            isHovered ? "animate-shine" : ""
          }`}
        />
      </div>

      {/* Modal de detalles */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ArticleDetails closeModal={closeModal} article={article} />
      </Modal>

    </>
  );
};

export default CardArticle;
