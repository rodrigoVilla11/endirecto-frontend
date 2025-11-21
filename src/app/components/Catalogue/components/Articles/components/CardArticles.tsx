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
      <div className={`relative flex flex-col bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 ${
        isMobile ? 'w-full' : 'w-full max-w-sm'
      }`}>
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
          <div className="absolute bottom-32 left-2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-full z-20">
            EQUIVALENCIA
          </div>
        )}

        {/* Contenido principal */}
        <div onClick={() => handleOpenModal(article)} className="cursor-pointer">
          {/* Imagen */}
          <div className="relative bg-white pt-8 px-2">
            <ArticleImage img={article.images} />
          </div>

          {/* Información del producto */}
          <div className={`${isMobile ? 'p-3' : 'p-4'} space-y-2`}>
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
                <div className="border-t border-gray-200" />
              </>
            )}

            <SuggestedPrice
              article={article}
              showPurchasePrice={showPurchasePrice}
            />
          </div>
        </div>

        {/* Sección de agregar al carrito */}
        <div className={`${isMobile ? 'p-2' : 'p-4'} bg-gray-50 border-t border-gray-200`}>
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