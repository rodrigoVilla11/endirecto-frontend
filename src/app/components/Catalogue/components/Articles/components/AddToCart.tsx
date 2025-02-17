import React from "react";
import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";
import { FaShoppingCart } from "react-icons/fa";
import { useAuth } from "@/app/context/AuthContext";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetStockByArticleIdQuery({
    articleId: encodedId,
  });
  const { role } = useAuth();

  const stockMessage = data?.quantity
    ? t("stockAvailable", { quantity: data.quantity })
    : t("noStock");

  const stockColor =
    data?.quantity && data.quantity !== "0" ? "text-green-600" : "text-red-500";

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {role !== "CUSTOMER" && (
        <p className={`text-xs font-semibold ${stockColor}`}>{stockMessage}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          className="border rounded w-12 p-1 text-center text-sm"
          min={1}
        />
        <button
          className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors text-white"
          onClick={() => onAddToCart(quantity)}
          aria-label={t("addToCart")}
        >
          <FaShoppingCart className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AddToCart;
