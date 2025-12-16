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
      className="
      flex flex-col sm:flex-row
      items-start sm:items-center
      sm:justify-between
      gap-4 mb-4
      p-4
      rounded-2xl
      bg-white/5 backdrop-blur
      border border-white/10
      shadow-xl
      hover:border-[#E10600]/40
      transition-all
    "
    >
      {/* Imagen del artículo */}
      <div
        className="
        w-24 h-24
        rounded-xl
        bg-white/5 border border-white/10
        flex items-center justify-center
        cursor-pointer
      "
        onClick={openModal}
      >
        <img
          src={article.images?.[0] || "/placeholder.png"}
          alt={article.name}
          className="w-full h-full object-contain rounded-lg p-2"
        />
      </div>

      {/* Detalles del artículo */}
      <div
        className="flex-1 flex flex-col gap-1 cursor-pointer"
        onClick={openModal}
      >
        <h3 className="text-xs font-extrabold text-white tracking-wide">
          {article.id}
        </h3>

        <p className="text-xs text-white/70 max-w-48 break-words line-clamp-2">
          {article.name}
        </p>

        <StripeStock articleId={article.id} />
      </div>

      {/* Precios */}
      <div
        className="flex flex-col items-end min-w-[150px] cursor-pointer"
        onClick={openModal}
      >
        <SuggestedPrice
          articleId={article.id}
          showPurchasePrice={showPurchasePrice}
          className="text-lg font-extrabold text-white"
        />

        {showPurchasePrice && (
          <CostPrice
            articleId={article.id}
            selectedClientId={selectedClientId}
            className="text-white/60 text-sm"
          />
        )}

        {/* Acento marca */}
        <div className="mt-1 h-0.5 w-12 bg-[#E10600] rounded-full opacity-80" />
      </div>

      {/* Menú del artículo */}
      <div className="flex justify-center items-center">
        <ArticleMenu
          onAddToFavourites={toggleFavourite}
          isFavourite={isFavourite}
          article={article}
        />
      </div>

      {/* Cantidad + carrito */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <input
          type="number"
          value={quantity}
          min={1}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="
          w-16 p-2 text-center
          rounded-xl
          bg-white/10
          border border-white/20
          text-white font-semibold
          focus:border-[#E10600]
          focus:outline-none
        "
        />

        <button
          onClick={toggleShoppingCart}
          className="
          flex items-center justify-center
          p-2 rounded-xl
          bg-[#E10600]
          text-white
          shadow-lg
          hover:scale-110 hover:shadow-xl
          transition-all
        "
          aria-label="Agregar al carrito"
        >
          <MdShoppingCart className="text-xl" />
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {/* Modal de detalles (sin cambios) */}
      </Modal>
    </div>
  );
};

export default ListArticle;
