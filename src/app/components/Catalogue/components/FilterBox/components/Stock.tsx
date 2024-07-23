'use client'
import React, { useState } from 'react'

const Stock = () => {
    const [selectedButton, setSelectedButton] = useState('inStock');

    return (
      <div className="px-4 text-sm">
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="stock"
          >
            Stock
          </label>
          <div className="flex justify-between items-center gap-1">
            <button
              onClick={() => setSelectedButton('inStock')}
              className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/3 py-1 ${
                selectedButton === 'inStock' ? 'bg-primary text-white' : ''
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setSelectedButton('limitedStock')}
              className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/3 py-1 ${
                selectedButton === 'limitedStock' ? 'bg-primary text-white' : ''
              }`}
            >
              Limited Stock
            </button>
            <button
              onClick={() => setSelectedButton('outOfStock')}
              className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/3 py-1 ${
                selectedButton === 'outOfStock' ? 'bg-primary text-white' : ''
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>
    );
}

export default Stock
