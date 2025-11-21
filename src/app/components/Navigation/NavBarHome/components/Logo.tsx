import React from 'react'

const Logo = () => {
  return (
    <div className='flex items-center group'>
      <div className='rounded-2xl p-3 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3'>
        <img 
          src="dma.png" 
          alt="logo-navbar" 
          className='h-10 sm:h-12 object-contain' 
        />
      </div>
    </div>
  )
}

export default Logo