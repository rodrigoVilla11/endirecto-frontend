import React from "react";
import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";
import { FaShoppingCart } from "react-icons/fa";
import { useAuth } from "@/app/context/AuthContext";

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
  const { role } = useAuth();

  const stockMessage = data?.quantity
    ? `Stock disponible: ${data.quantity}`
    : "Sin stock";

  const stockColor =
    data?.quantity && data.quantity !== "0" ? "text-green-600" : "text-red-500";

  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-2 bg-gray-200 shadow-md w-full max-w-sm">
      {role !== "CUSTOMER" && (
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold ${stockColor}`}>
            {stockMessage}
          </p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          className="border rounded w-16 p-1 text-center text-sm"
          min={1}
        />
        <button
          className="bg-black text-white p-2 rounded flex items-center hover:bg-gray-800 transition"
          onClick={() => onAddToCart(quantity)}
        >
          <FaShoppingCart />
        </button>
      </div>
    </div>
  );
};

export default AddToCart;
