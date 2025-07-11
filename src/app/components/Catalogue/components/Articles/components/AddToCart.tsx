import React, { useState, useEffect } from "react";
import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { useAuth } from "@/app/context/AuthContext";
import { useTranslation } from "react-i18next";

interface AddToCartProps {
  articleId: string;
  onAddToCart: (quantity: number) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  disabled?: boolean; // Nueva prop opcional
}

const AddToCart: React.FC<AddToCartProps> = ({
  articleId,
  onAddToCart,
  quantity,
  setQuantity,
  disabled = false, // Valor por defecto
}) => {
  const { t } = useTranslation();
  const encodedId = encodeURIComponent(articleId);
  const { data } = useGetStockByArticleIdQuery({
    articleId: encodedId,
  });
  const { role } = useAuth();

  const stockMessage = data?.quantity
    ? t("stockAvailable", { quantity: data.quantity })
    : t("noStock");

  const stockColor =
    data?.quantity && data.quantity !== "0" ? "text-green-600" : "text-red-500";

  // Estado local para el input como string
  const [inputValue, setInputValue] = useState("");

  // Estado local para mostrar el tick de confirmación
  const [showTick, setShowTick] = useState(false);

  // Sincronizamos el input local con el valor numérico recibido
  useEffect(() => {
    if (quantity === 1) {
      setInputValue("");
    } else {
      setInputValue(quantity.toString());
    }
  }, [quantity]);

  // Función para actualizar la cantidad
  const updateQuantity = (value: string) => {
    if (disabled) return; // No actualizar si está disabled
    
    setInputValue(value);
    const parsed = Number(value);
    if (value.trim() !== "" && !isNaN(parsed) && parsed > 0) {
      setQuantity(parsed);
    }
  };

  const handleAddToCart = () => {
    if (disabled) return; // No ejecutar si está disabled
    
    const qty = inputValue.trim() === "" ? 1 : Number(inputValue);
    const validQty = Math.max(1, qty);
    setQuantity(validQty);
    onAddToCart(validQty);
    
    // Mostrar tick de confirmación
    setShowTick(true);
    setTimeout(() => {
      setShowTick(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {role !== "CUSTOMER" && (
        <p className={`text-xs font-semibold ${stockColor}`}>{stockMessage}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => updateQuantity(e.target.value)}
          placeholder="1"
          className={`border rounded w-12 p-1 text-center text-sm ${
            disabled 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
              : "bg-white text-gray-900"
          }`}
          min="1"
          disabled={disabled}
          onBlur={() => {
            if (!disabled && inputValue.trim() === "") {
              setInputValue("");
              setQuantity(1);
            }
          }}
        />
        <button
          className={`p-2 rounded-full transition-colors text-white ${
            disabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90"
          }`}
          onClick={handleAddToCart}
          aria-label={t("addToCart")}
          disabled={disabled}
        >
          {showTick ? (
            <FaCheck className="w-4 h-4" />
          ) : (
            <FaShoppingCart className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default AddToCart;