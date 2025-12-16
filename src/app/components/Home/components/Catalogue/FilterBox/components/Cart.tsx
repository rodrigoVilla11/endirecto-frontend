"use client";
import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa6";

const Cart = ({ onChange }: any) => {
  const [selectedCart, setSelectedCart] = useState(1);
  const carts = [
    { id: 1, name: "Order" },
    { id: 2, name: "Budget" },
  ];

  const handleOrderChange = (event: any) => {
    setSelectedCart(event.target.value);
  };

  return (
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label
          htmlFor="cart"
          className="block text-white/80 text-sm font-extrabold mb-2"
        >
          Cart
        </label>

        <div className="relative flex items-center">
          <select
            id="cart"
            value={selectedCart}
            onChange={handleOrderChange}
            className="
            w-full
            bg-white/5
            border border-white/10
            rounded-xl
            py-2.5 pl-3 pr-10
            text-white
            text-sm
            font-semibold
            appearance-none
            transition-all duration-200
            focus:outline-none
            focus:border-[#E10600]/60
            focus:ring-2 focus:ring-[#E10600]/30
            hover:border-[#E10600]/40
          "
          >
            {carts.map((cart) => (
              <option
                key={cart.id}
                value={cart.id}
                className="bg-[#0B0B0B] text-white"
              >
                {cart.name}
              </option>
            ))}
          </select>

          {/* Chevron */}
          <FaAngleDown className="absolute right-3 text-white/60 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default Cart;
