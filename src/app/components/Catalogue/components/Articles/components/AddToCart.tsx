import React, { useState, useEffect } from "react";
import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { useAuth } from "@/app/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useMobile } from "@/app/context/ResponsiveContext";

interface AddToCartProps {
  articleId: string;
  onAddToCart: (quantity: number) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  disabled?: boolean;
}

const AddToCart: React.FC<AddToCartProps> = ({
  articleId,
  onAddToCart,
  quantity,
  setQuantity,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const encodedId = encodeURIComponent(articleId);
  const { data } = useGetStockByArticleIdQuery({
    articleId: encodedId,
  });
  const { role } = useAuth();

  const [inputValue, setInputValue] = useState("");
  const [showTick, setShowTick] = useState(false);

  useEffect(() => {
    if (quantity === 1) {
      setInputValue("");
    } else {
      setInputValue(quantity.toString());
    }
  }, [quantity]);

  const updateQuantity = (value: string) => {
    if (disabled) return;

    setInputValue(value);
    const parsed = Number(value);
    if (value.trim() !== "" && !isNaN(parsed) && parsed > 0) {
      setQuantity(parsed);
    }
  };

  const handleAddToCart = () => {
    if (disabled) return;

    const qty = inputValue.trim() === "" ? 1 : Number(inputValue);
    const validQty = Math.max(1, qty);
    setQuantity(validQty);
    onAddToCart(validQty);

    setShowTick(true);
    setTimeout(() => {
      setShowTick(false);
    }, 2000);
  };

  return (
    <div className="flex items-center justify-center gap-2 w-full">
      {/* Input cantidad */}
      <input
        type="number"
        value={inputValue}
        onChange={(e) => updateQuantity(e.target.value)}
        placeholder="1"
        min="1"
        disabled={disabled}
        onBlur={() => {
          if (!disabled && inputValue.trim() === "") {
            setInputValue("");
            setQuantity(1);
          }
        }}
        className={`
        border rounded-xl text-center font-semibold
        ${isMobile ? "w-12 px-2 py-1.5 text-xs" : "w-16 px-3 py-2 text-sm"}
        transition-all
        ${
          disabled
            ? "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
            : "bg-white/10 text-white border-white/20 focus:border-[#E10600] focus:outline-none"
        }
      `}
      />

      {/* Botón agregar */}
      <button
        onClick={handleAddToCart}
        aria-label={t("addToCart")}
        disabled={disabled}
        className={`
        ${isMobile ? "p-2" : "p-3"}
        rounded-full
        flex items-center justify-center
        transition-all duration-300
        shadow-lg
        ${
          disabled
            ? "bg-white/10 text-white/40 cursor-not-allowed"
            : "bg-[#E10600] text-white hover:shadow-xl hover:scale-110"
        }
      `}
      >
        {showTick ? (
          <FaCheck className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
        ) : (
          <FaShoppingCart className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
        )}
      </button>
    </div>
  );
};

export default AddToCart;
