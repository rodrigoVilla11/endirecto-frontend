"use client";
import React, { useState } from "react";

const Stock = ({ onChange }: any) => {
  const [selectedButton, setSelectedButton] = useState("");

  const handleButtonClick = (value: string) => {
    if (selectedButton !== value) {
      setSelectedButton(value);
      onChange(value === "STOCK" ? ["IN-STOCK", "LIMITED-STOCK"] : ["NO-STOCK"]);
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
            onClick={() => handleButtonClick("STOCK")}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              selectedButton === "STOCK" ? "bg-primary text-white" : ""
            }`}
            value={"STOCK"}
          >
            Stock
          </button>
          <button
            onClick={() => handleButtonClick("NO-STOCK")}
            className={`flex gap-1 items-center justify-center rounded-md border border-primary w-1/2 py-1 ${
              selectedButton === "NO-STOCK" ? "bg-primary text-white" : ""
            }`}
            value={"NO-STOCK"}
          >
            Out of Stock
          </button>
        </div>
      </div>
    </div>
  );
};

export default Stock;
