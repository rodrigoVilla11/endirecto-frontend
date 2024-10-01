import React from 'react'

const ImageArticlesSlider = ({img} : any) => {
  return (
    <div className='w-56 h-56 border border-black flex justify-center items-center'>
      <img src={img} />
    </div>
  )
}

export default ImageArticlesSlider