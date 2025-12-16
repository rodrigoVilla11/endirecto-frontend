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
    <div className="text-xs font-semibold text-white/80 px-4">
      <div className="mb-4">
        <label
          htmlFor="cart"
          className="block text-white/70 font-extrabold mb-2 uppercase tracking-wide"
        >
          Cart
        </label>

        <div className="relative">
          <select
            id="cart"
            value={selectedCart}
            onChange={handleOrderChange}
            className="
          w-full
          appearance-none
          rounded-2xl
          px-4 py-2
          bg-white/10
          border border-white/20
          text-white font-bold text-xs
          backdrop-blur
          shadow-lg
          transition-all duration-200
          hover:bg-white/20
          focus:outline-none
          focus:ring-2 focus:ring-purple-400
        "
          >
            {carts.map((cart, index) => (
              <option
                key={index}
                value={cart.id}
                className="bg-zinc-900 text-white font-semibold"
              >
                {cart.name}
              </option>
            ))}
          </select>

          {/* Icono */}
          <FaAngleDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default Cart;
