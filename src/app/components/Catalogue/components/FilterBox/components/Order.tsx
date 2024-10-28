'use client'
import React, { useState } from 'react';
import { FaAngleDown } from "react-icons/fa6";

const Order = ({onChange} : any) => {
  const [selectedOrder, setSelectedOrder] = useState(1);
  const order = [
    { id: 1, name: 'Best Sellers' },
    { id: 2, name: 'By Brands' },
    { id: 3, name: 'By Code' },
    { id: 4, name: 'Lower Price' },
    { id: 5, name: 'Higher Price' },
    { id: 6, name: 'Stock' },
  ];

  const handleOrderChange = (event : any) => {
    setSelectedOrder(event.target.value);
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
