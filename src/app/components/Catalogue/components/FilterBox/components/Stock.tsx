'use client'
import React, { useState } from 'react'

const Stock = ({onChange} : any) => {
  
    const [selectedButton, setSelectedButton] = useState('');

    const handleButtonClick = (value: string) => {
      setSelectedButton(value);
      onChange(value); 
    };

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
              onClick={() => handleButtonClick('IN-STOCK')}
              className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/3 py-1 ${
                selectedButton === 'IN-STOCK' ? 'bg-primary text-white' : ''
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => handleButtonClick('LIMITED-STOCK')}
              className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/3 py-1 ${
                selectedButton === 'LIMITED-STOCK' ? 'bg-primary text-white' : ''
              }`}
            >
              Limited Stock
            </button>
            <button
              onClick={() => handleButtonClick('NO-STOCK')}
              className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/3 py-1 ${
                selectedButton === 'NO-STOCK' ? 'bg-primary text-white' : ''
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
