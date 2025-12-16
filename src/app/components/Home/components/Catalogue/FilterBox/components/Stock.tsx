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
          htmlFor="stock"
          className="block text-white/80 text-sm font-extrabold mb-2"
        >
          Stock
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleButtonClick("IN-STOCK")}
            className={`
            w-1/3
            flex items-center justify-center gap-1
            py-2 rounded-xl
            border
            font-bold text-xs sm:text-sm
            transition-all duration-200
            ${
              selectedButton === "IN-STOCK"
                ? "bg-[#E10600] text-white border-[#E10600]"
                : "bg-white/5 text-white/70 border-white/10 hover:border-[#E10600]/40 hover:bg-white/10"
            }
          `}
          >
            In Stock
          </button>

          <button
            type="button"
            onClick={() => handleButtonClick("LIMITED-STOCK")}
            className={`
            w-1/3
            flex items-center justify-center gap-1
            py-2 rounded-xl
            border
            font-bold text-xs sm:text-sm
            transition-all duration-200
            ${
              selectedButton === "LIMITED-STOCK"
                ? "bg-[#E10600] text-white border-[#E10600]"
                : "bg-white/5 text-white/70 border-white/10 hover:border-[#E10600]/40 hover:bg-white/10"
            }
          `}
          >
            Limited
          </button>

          <button
            type="button"
            onClick={() => handleButtonClick("NO-STOCK")}
            className={`
            w-1/3
            flex items-center justify-center gap-1
            py-2 rounded-xl
            border
            font-bold text-xs sm:text-sm
            transition-all duration-200
            ${
              selectedButton === "NO-STOCK"
                ? "bg-[#E10600] text-white border-[#E10600]"
                : "bg-white/5 text-white/70 border-white/10 hover:border-[#E10600]/40 hover:bg-white/10"
            }
          `}
          >
            Sin stock
          </button>
        </div>
      </div>
    </div>
  );
};

export default Stock;
