import React from 'react';
import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";
import { FaShoppingCart } from 'react-icons/fa';

interface AddToCartProps {
  articleId: string;
  onAddToCart: (quantity: number) => void; 
  quantity?: number; // Añadir quantity como prop opcional
  setQuantity: (quantity: number) => void; // Función para establecer la cantidad
}

const AddToCart: React.FC<AddToCartProps> = ({ articleId, onAddToCart, quantity = 1, setQuantity }) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetStockByArticleIdQuery({
    articleId: encodedId,
  });

  return (
    <div className='flex items-center justify-center px-4 p-2 bg-gray-200 h-12'>
      <input 
        type="number" 
        value={quantity} 
        onChange={(e) => setQuantity(Number(e.target.value) || 1)} 
        min={1} 
       className="border rounded w-16 p-1 text-center text-sm"
      />
      <button
        className='bg-black text-white p-2 rounded flex items-center'
        onClick={() => onAddToCart(quantity)} 
      >
        <FaShoppingCart />
      </button>
    </div>
  );
};

export default AddToCart;
