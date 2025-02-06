'use client'
import React, { useState } from 'react';
import { FaAngleDown } from "react-icons/fa6";

const Order = ({onChange} : any) => {
  const [selectedOrder, setSelectedOrder] = useState(1);
  const order = [
    { id: "best-seller", name: 'Best Sellers' },
    { id: "brand:asc", name: 'By Brands' },
    { id: "code:asc", name: 'By Code' },
    { id: "price:asc", name: 'Lower Price' },
    { id: "price:desc", name: 'Higher Price' },
    { id: "stock:desc", name: 'Stock' },
  ];

  const handleOrderChange = (event : any) => {
    setSelectedOrder(event.target.value);
    onChange(event.target.value)
  };

  return (
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="order">
          Order
        </label>
        <div className='relative flex gap-1 justify-center items-center'>
        <select
          id="order"
          value={selectedOrder}
          onChange={handleOrderChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          {order.map((order) => (
            <option key={order.id} value={order.id}>
              {order.name}  
            </option>
          ))}
        </select>
        <FaAngleDown className="absolute right-3 pointer-events-none"/>
        </div>
      </div>
    </div>
  );
};

export default Order;
