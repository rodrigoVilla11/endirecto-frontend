"use client";

import { useEffect, useState } from "react";
import StripeStock from "./StripeStock";
import ArticleName from "./ArticleName";
import ArticleImage from "./ArticleImage";
import ArticleMenu from "./ArticleMenu";
import CostPrice from "./CostPrice";
import SuggestedPrice from "./SuggestedPrice";
import AddToCart from "./AddToCart";
import Modal from "@/app/components/components/Modal";
import { useClient } from "@/app/context/ClientContext";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import ArticleDetails from "./ArticleDetails";
import { useArticleId } from "@/app/context/AritlceIdContext";
import Tag from "@/app/components/Home/components/Catalogue/Articles/components/Tag";
import { useMobile } from "@/app/context/ResponsiveContext";

interface FormState {
  id: string;
  favourites: string[];
  shopping_cart: string[];
}

const CardArticles = ({ article, showPurchasePrice }: any) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { selectedClientId } = useClient();
  const [quantity, setQuantity] = useState(1);
  const { articleId, setArticleId } = useArticleId();
  const [modalArticle, setModalArticle] = useState(null);
  const { isMobile } = useMobile();

  const {
    data: customer,
    error,
    isLoading,
    refetch,
  } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const [updateCustomer] = useUpdateCustomerMutation();
  const [form, setForm] = useState<FormState>({
    id: "",
    favourites: [],
    shopping_cart: [],
  });

  useEffect(() => {
    if (customer) {
      setForm({
        id: customer.id || "",
        favourites: customer.favourites || [],
        shopping_cart: customer.shopping_cart || [],
      });
    }
  }, [customer]);

  const toggleFavourite = () => {
    setForm((prev) => {
      const isFavourite = prev.favourites.includes(article.id);
      const updatedFavourites = isFavourite
        ? prev.favourites.filter((id) => id !== article.id)
        : [...prev.favourites, article.id];

      updateCustomer({ id: form.id, favourites: updatedFavourites }).then(
        () => {
          refetch();
        }
      );

      return {
        ...prev,
        favourites: updatedFavourites,
      };
    });
  };

  const toggleShoppingCart = () => {
    setForm((prev) => {
      const newShoppingCart = [...prev.shopping_cart];
      for (let i = 0; i < quantity; i++) {
        newShoppingCart.push(article.id);
      }

      updateCustomer({ id: form.id, shopping_cart: newShoppingCart }).then(
        () => {
          refetch();
        }
      );

      return {
        ...prev,
        shopping_cart: newShoppingCart,
      };
    });
  };

  const isFavourite = form.favourites.includes(article.id);
  const closeModal = () => setModalOpen(false);
  const handleOpenModal = (article: any) => {
    setArticleId(article.id);
    setModalArticle(article);
    setModalOpen(true);
  };

  return (
    <div>
      <div
        className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
          isMobile ? "w-full" : "w-full max-w-sm"
        } bg-white/5 backdrop-blur border border-white/10 shadow-xl hover:shadow-2xl hover:border-[#E10600]/40`}
      >
        {/* Header con iconos */}
        <div className="absolute top-2 left-2 right-2 z-30 flex justify-between items-start">
          {/* Indicador de stock circular a la izquierda */}
          <div className="flex-shrink-0">
            <StripeStock articleId={article.id} />
          </div>

          {/* Iconos a la derecha */}
          <div className="flex items-center gap-1">
            <ArticleMenu
              onAddToFavourites={toggleFavourite}
              isFavourite={isFavourite}
              article={article}
            />
          </div>
        </div>

        {/* Tag en la esquina superior izquierda */}
        {article.tag && (
          <div className="absolute top-8 left-2 z-20">
            <Tag tag={article.tag} />
          </div>
        )}

        {/* Indicador de equivalencia */}
        {article.foundEquivalence && (
          <div className="absolute bottom-32 left-2 bg-[#E10600] text-white text-[10px] font-extrabold px-2 py-1 rounded-full z-20 shadow">
            EQUIVALENCIA
          </div>
        )}

        {/* Contenido principal */}
        <div
          onClick={() => handleOpenModal(article)}
          className="cursor-pointer"
        >
          {/* Imagen */}
          <div className="relative pt-8 px-2">
            <ArticleImage img={article.images} />
          </div>

          {/* Información del producto */}
          <div className={`${isMobile ? "p-3" : "p-4"} space-y-2 text-white`}>
            <ArticleName
              name={article.name}
              id={article.id}
              code={article.supplier_code}
            />

            {showPurchasePrice && (
              <>
                <CostPrice
                  article={article}
                  selectedClientId={selectedClientId}
                />
                <div className="border-t border-white/10" />
              </>
            )}

            <SuggestedPrice
              article={article}
              showPurchasePrice={showPurchasePrice}
            />
          </div>
        </div>

        {/* Sección de agregar al carrito */}
        <div
          className={`${
            isMobile ? "p-2" : "p-4"
          } bg-white/5 border-t border-white/10`}
        >
          <AddToCart
            articleId={article.id}
            onAddToCart={toggleShoppingCart}
            quantity={quantity}
            setQuantity={setQuantity}
          />
        </div>

        {/* Barra de stock en la parte inferior */}
        <div className="w-full">
          <StripeStock articleId={article.id} isBar />
        </div>

        {/* Acento marca */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E10600] opacity-90" />
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ArticleDetails
          closeModal={closeModal}
          article={modalArticle}
          showPurchasePrice={showPurchasePrice}
        />
      </Modal>
    </div>
  );
};

export default CardArticles;
