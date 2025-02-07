"use client";
import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

const PurchasePrice = ({ onToggle }: { onToggle: (show: boolean) => void }) => {
  const [showPrice, setShowPrice] = useState(true);

  const handleShowPrice = (value: boolean) => {
    setShowPrice(value);
    onToggle(value);
  };

  return (
    <div className="text-xs font-semibold">
      <div className="mb-4">
        <label
          className="block text-gray-700 font-bold mb-2"
          htmlFor="cart"
        >
          Show Purchase Price
        </label>
        <div className="flex justify-between items-center gap-2">
          <button
            onClick={() => handleShowPrice(true)}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              showPrice ? "bg-primary text-white" : ""
            }`}
          >
            <FaRegEye /> Show
          </button>
          <button
            onClick={() => handleShowPrice(false)}
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
