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
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import { MdShoppingCart } from "react-icons/md";

interface FormState {
  id: string;
  favourites: string[];
  shopping_cart: string[];
}

const ListArticle = ({ article, showPurchasePrice }: any) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { selectedClientId } = useClient();
  const [quantity, setQuantity] = useState(1); // Definimos quantity y setQuantity aquí

  const {
    data: customer,
    error,
    refetch,
  } = useGetCustomerByIdQuery({
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
  const closeModal = () => {
    setModalOpen(false);

  };
  

  return (
    <div
      className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-lg mb-4 gap-4"
      
    >
      {/* Imagen del artículo */}
      <div className="flex items-center justify-center w-24 h-24 bg-white border border-gray-200 rounded-lg shadow-sm" onClick={openModal}>
        <img
          src={article.images?.[0] || "/placeholder.png"}
          alt={article.name}
          className="w-full h-full object-contain rounded-md"
        />
      </div>

      {/* Detalles del artículo */}
      <div className="flex-1 flex flex-col gap-1" onClick={openModal}>
        <h3 className="text-xs font-bold text-gray-800">{article.id}</h3>
        <p className="text-xs text-gray-600 max-w-48 break-words overflow-hidden max-h-12 ">
          {article.name}
        </p>
        <StripeStock
          articleId={article.id}
          className="text-xs font-medium text-red-500"
        />
      </div>

      {/* Precios */}
      <div className="flex flex-col items-end min-w-[150px] gap-2" onClick={openModal}>
        <SuggestedPrice
          articleId={article.id}
          showPurchasePrice={showPurchasePrice}
          className="text-xl font-bold text-gray-900"
        />
        {showPurchasePrice && (
          <CostPrice articleId={article.id} selectedClientId={selectedClientId}  className="text-gray-500 text-sm" />
        )}
      </div>

      {/* Menú del artículo */}
      <div className="flex justify-center items-center">
        <ArticleMenu
          onAddToFavourites={toggleFavourite}
          isFavourite={isFavourite}
          article={article}
        />
      </div>

      {/* Cantidad y botón de agregar al carrito */}
      <div className="flex items-center gap-2 w-1/6">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-16 p-2 text-center border border-gray-300 rounded-lg"
          min={1}
        />
        <button
          onClick={toggleShoppingCart}
          className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg shadow-sm"
        >
          <MdShoppingCart className="text-xl" />
        </button>
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

export default ListArticle;
