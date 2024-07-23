import React from 'react'
import { BsTag } from "react-icons/bs";
import { FaCar } from "react-icons/fa6";
import ImageArticlesSlider from './ImageArticlesSlider';

const CardArticles = () => {
  return (
    <div className='h-90 w-56 shadow-2xl rounded-md'>
        <div className='h-6 flex justify-end items-center gap-2 px-2 text-secondary'><BsTag/><FaCar/></div>
        <ImageArticlesSlider />
        <div className='p-2'>
            <h3 className='text-xl'>OC46</h3>
            <p className='text-xs text-secondary pt-6'>FILTRO DE ACEITE SELLADO</p>
        </div>
    </div>
  )
}

export default CardArticles