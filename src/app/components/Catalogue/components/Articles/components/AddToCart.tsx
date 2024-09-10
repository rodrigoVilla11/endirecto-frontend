import React from 'react'
import { useGetStockByArticleIdQuery } from "@/redux/services/stockApi";


const AddToCart = ({ articleId }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading, refetch } = useGetStockByArticleIdQuery({
    articleId: encodedId,
  });
  return (
    <div className='flex justify-center items-center'>
        <div className='rounded-l-sm border border-black p-2 text-xs'>{data?.quantity}</div>
        <button className='bg-black border border-black text-white rounded-r-sm p-2 text-xs font-bold'>ADD TO CART</button>
    </div>
  )
}

export default AddToCart