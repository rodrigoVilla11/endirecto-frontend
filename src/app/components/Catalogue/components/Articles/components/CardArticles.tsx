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

interface FormState {
  id: string;
  favourites: string[];
  shopping_cart: string[];
}

const CardArticles = ({ article }: any) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { selectedClientId } = useClient();
  const [quantity, setQuantity] = useState(1);

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
      <div className="h-116 w-68 bg-white rounded-sm">
        <ArticleMenu
          onAddToFavourites={toggleFavourite}
          isFavourite={isFavourite}
        />
        <div onClick={openModal}>
          <ArticleImage img={article.image} />
          <StripeStock articleId={article.id} />
          <ArticleName name={article.name} id={article.id} />
          <CostPrice articleId={article.id} />
          <hr />
          <SuggestedPrice articleId={article.id} />
        </div>
        <AddToCart
          articleId={article.id}
          onAddToCart={toggleShoppingCart}
          quantity={quantity} 
          setQuantity={setQuantity}
        />
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
          <div className="h-116 w-72 bg-white rounded-sm border border-black">
            <ArticleMenu
              onAddToFavourites={toggleFavourite}
              isFavourite={isFavourite}
            />
            <ArticleImage img={article.image} />
            <StripeStock articleId={article.id} />
            <ArticleName name={article.name} id={article.id} />
            <CostPrice articleId={article.id} />
            <hr />
            <SuggestedPrice articleId={article.id} />
            <AddToCart
              articleId={article.id}
              onAddToCart={toggleShoppingCart}
              quantity={quantity} 
              setQuantity={setQuantity}
            />
          </div>
          <Description article={article} description={article.description} />
        </div>
      </Modal>
    </div>
  );
};

export default CardArticles;
