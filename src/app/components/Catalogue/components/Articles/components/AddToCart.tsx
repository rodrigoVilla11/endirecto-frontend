import React from 'react';
import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";

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
    <div className='flex justify-center items-center'>
      <input 
        type="number" 
        value={quantity} 
        onChange={(e) => setQuantity(Number(e.target.value) || 1)} 
        min={1} 
        className='rounded-l-sm border border-black p-2 text-xs w-12'
      />
      <button
        className='bg-black border border-black text-white rounded-r-sm p-2 text-xs font-bold'
        onClick={() => onAddToCart(quantity)} 
      >
        ADD TO CART
      </button>
    </div>
  );
};

export default AddToCart;
