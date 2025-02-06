"use client";
import React, { useState } from "react";

const Stock = ({ onChange }: any) => {
  const [selectedButton, setSelectedButton] = useState("");

  const handleButtonClick = (value: string) => {
    if (selectedButton !== value) {
      setSelectedButton(value);
      onChange(value); 
    } else {
      setSelectedButton("");
      onChange("");
    }
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
            onClick={() => handleButtonClick("stock:desc")}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              selectedButton === "stock:desc" ? "bg-primary text-white" : ""
            }`}
          >
            Stock
          </button>
          <button
            onClick={() => handleButtonClick("stock:asc")}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              selectedButton === "stock:asc" ? "bg-primary text-white" : ""
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>
    </div>
  );
};

export default Stock;
