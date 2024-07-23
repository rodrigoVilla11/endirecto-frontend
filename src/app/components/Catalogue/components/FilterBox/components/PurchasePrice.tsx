'use client'
import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

const PurchasePrice = () => {
  const [showPrice, setShowPrice] = useState(false);

  return (
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="cart"
        >
          Show Purchase Price
        </label>
        <div className="flex justify-between items-center gap-2">
          <button
            onClick={() => setShowPrice(true)}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              showPrice ? "bg-primary text-white" : ""
            }`}
          >
            <FaRegEye /> Show
          </button>
          <button
            onClick={() => setShowPrice(false)}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              !showPrice ? "bg-primary text-white" : ""
            }`}
          >
            <FaRegEyeSlash /> Hide
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchasePrice;
