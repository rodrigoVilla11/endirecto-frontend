import React from 'react'

const ImageArticlesSlider = ({img} : any) => {
  return (
    <div className='flex justify-center mb-4 p-4 bg-white'>
    <img className='w-32 h-40 object-contain' src={img} alt="Artículo" />
  </div>
  )
}

export default ImageArticlesSlider