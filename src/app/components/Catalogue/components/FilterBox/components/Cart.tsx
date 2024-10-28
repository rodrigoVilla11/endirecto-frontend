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
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="cart"
        >
          Cart
        </label>
        <div className="relative flex gap-1 justify-center items-center">
          <select
            id="cart"
            value={selectedCart}
            onChange={handleOrderChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {carts.map((cart) => (
              <option key={cart.id} value={cart.id}>
                {cart.name}
              </option>
            ))}
          </select>
          <FaAngleDown className="absolute right-3 pointer-events-none"/>
        </div>
      </div>
    </div>
  );
};

export default Cart;
