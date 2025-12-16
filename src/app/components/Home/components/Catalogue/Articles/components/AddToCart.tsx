import React from "react";
import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";
import { FaShoppingCart } from "react-icons/fa";

interface AddToCartProps {
  articleId: string;
  onAddToCart: (quantity: number) => void;
  quantity?: number;
  setQuantity: (quantity: number) => void;
}

const AddToCart: React.FC<AddToCartProps> = ({
  articleId,
  onAddToCart,
  quantity = 1,
  setQuantity,
}) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetStockByArticleIdQuery({
    articleId: encodedId,
  });

  return (
    <div
      className="
      flex items-center justify-center gap-3
      px-4 py-3
      bg-white/5 backdrop-blur
      border border-white/10
      rounded-2xl
    "
    >
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value) || 1)}
        min={1}
        className="
        w-16
        bg-[#0B0B0B]
        border border-white/10
        rounded-xl
        p-2
        text-center text-sm font-bold
        text-white
        focus:outline-none
        focus:border-[#E10600]/60
        focus:ring-2 focus:ring-[#E10600]/30
      "
      />

      <button
        onClick={() => onAddToCart(quantity)}
        className="
        flex items-center justify-center gap-2
        px-4 py-2
        bg-[#E10600]
        text-white
        rounded-xl
        font-extrabold
        hover:bg-[#c80500]
        transition-all
        shadow-lg
        hover:shadow-xl
        transform hover:scale-105
      "
        title="Agregar al carrito"
      >
        <FaShoppingCart className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AddToCart;
