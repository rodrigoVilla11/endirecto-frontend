import React, { useEffect, useState } from "react";
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
import { useClient } from "@/app/context/ClientContext";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import ArticleDetails from "./ArticleDetails";
import { useArticleId } from "@/app/context/AritlceIdContext";
import Tag from "@/app/components/Home/components/Catalogue/Articles/components/Tag";

interface FormState {
  id: string;
  favourites: string[];
  shopping_cart: string[];
}

const CardArticles = ({ article, showPurchasePrice }: any) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { selectedClientId } = useClient();
  const [quantity, setQuantity] = useState(1);
  const { articleId, setArticleId} = useArticleId(); 

  useEffect(() => {
    if (articleId && articleId === article.id) {
      setModalOpen(true);
      setArticleId(null); 
    }
  }, [articleId, article.id]); 


  const {
    data: customer,
    error,
    isLoading,
    refetch,
  } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  if (error) {
    console.error("Error fetching customer:", error);
  }

  const [updateCustomer, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateCustomerMutation();

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

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <div>
      <div className="relative flex flex-col justify-between shadow-lg bg-white w-60 cursor-pointer">
        <ArticleMenu
          onAddToFavourites={toggleFavourite}
          isFavourite={isFavourite}
          article={article}
        />
        <div onClick={openModal}>
          <div className="absolute w-full h-3/6 flex justify-end items-end pb-8"><Tag articleId={article.id}/></div>
          <ArticleImage img={article.images} />
          <StripeStock articleId={article.id} />
          <div className="bg-gray-200">
            <ArticleName name={article.name} id={article.id} code={article.supplier_code}/>
            {showPurchasePrice && <CostPrice articleId={article.id} selectedClientId={selectedClientId} />}
            {showPurchasePrice && <hr className="bg-white border-white m-4" />}
            <SuggestedPrice articleId={article.id} showPurchasePrice={showPurchasePrice} />
          </div>
        </div>
        <AddToCart
          articleId={article.id}
          onAddToCart={toggleShoppingCart}
          quantity={quantity}
          setQuantity={setQuantity}
        />
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ArticleDetails
          closeModal={closeModal}
          toggleFavourite={toggleFavourite}
          isFavourite={isFavourite}
          article={article}
          toggleShoppingCart={toggleShoppingCart}
          quantity={quantity}
          setQuantity={setQuantity}
        />
      </Modal>
    </div>
  );
};

export default CardArticles;
