'use client'
import React, { useState } from "react";

const Tag = ({ onSelectTags }: any) => {
  const [selectedItem, setSelectedItem] = useState("");

  const handleButtonClick = (value: string) => {
    setSelectedItem(value);
    onSelectTags(value);
  };

  return (
    <div className="px-4 text-sm text-white">
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="cart"
        >
          Tag
        </label>
        <div className="flex justify-between items-center gap-2">
          {['OFFERS', 'PROMO', 'NEW', 'KITS'].map((tag) => (
            <button
              key={tag}
              className={`flex gap-1 items-center justify-center rounded-md w-1/2 py-1 ${
                selectedItem === tag ? 'bg-blue-500' : 'bg-gray-500'
              }`}
              onClick={() => handleButtonClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tag;
