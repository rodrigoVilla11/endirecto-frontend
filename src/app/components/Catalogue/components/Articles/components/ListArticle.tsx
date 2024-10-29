import React, { useEffect, useState } from "react";
import StripeStock from "./StripeStock";
import ArticleName from "./ArticleName";
import ArticleImage from "./ArticleImage";
import ArticleMenu from "./ArticleMenu";
import CostPrice from "./CostPrice";
import SuggestedPrice from "./SuggestedPrice";
import AddToCart from "./AddToCart";
import Modal from "@/app/components/components/Modal";
import ArticleDetails from "./ArticleDetails";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery, useUpdateCustomerMutation } from "@/redux/services/customersApi";

interface FormState {
  id: string;
  favourites: string[];
  shopping_cart: string[];
}

const ListArticle = ({ article, showPurchasePrice }: any) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { selectedClientId } = useClient();
  const [quantity, setQuantity] = useState(1); // Definimos quantity y setQuantity aquí

  const { data: customer, error, refetch } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  
  if (error) {
    console.error("Error fetching customer:", error);
  }

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

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-lg mb-4">
    <div className="flex items-center w-1/6">
      <ArticleImage img={article.images} 
      />
    </div>

    <div className="flex-1 ml-4">
      <ArticleName name={article.name} id={article.id} className="text-lg font-semibold" />
    </div>

    {/* Estado de stock */}
    <div className="flex items-center justify-center w-1/6">
      <StripeStock articleId={article.id} className="text-green-500 text-center" />
    </div>

    {/* Precios */}
    <div className="flex flex-col items-end w-1/4">
      <SuggestedPrice
        articleId={article.id}
        showPurchasePrice={showPurchasePrice}
        className="text-xl font-bold text-gray-900"
      />
      {showPurchasePrice && (
        <CostPrice
          articleId={article.id}
          className="text-gray-500 text-sm"
        />
      )}
    </div>
    <ArticleMenu
          onAddToFavourites={toggleFavourite}
          isFavourite={isFavourite}
        />
        
    {/* Campo para agregar cantidad y botón de carrito */}
    <div className="flex items-center w-1/6">
      <AddToCart
        articleId={article.id}
        onAddToCart={toggleShoppingCart}
        quantity={quantity}
        setQuantity={setQuantity}
      />
    </div>
  </div>
  );
};

export default ListArticle;
