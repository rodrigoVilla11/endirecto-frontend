import React from 'react'
import { FaXmark } from "react-icons/fa6";
import Order from './components/Order';
import Cart from './components/Cart';
import PurchasePrice from './components/PurchasePrice';
import Tag from './components/Tag';
import Stock from './components/Stock';
import Brands from './components/Brands';
import Items from './components/Items';
import VehiclesBrands from './components/VehiclesBrands';

const FilterBox = ({ isVisible, onClose }) => {
  return (
    <>
      {isVisible && (
        <div className='w-80 h-auto shadow-2xl rounded-md bg-white pb-4'>
          <div className='p-2 flex justify-end items-center text-2xl'>
            <button onClick={onClose}><FaXmark /></button>
          </div>
          <Order />
          <Cart />
          <PurchasePrice />
          <Tag />
          <Stock />
          <Brands />
          <Items />
          <VehiclesBrands />
        </div>
      )}
    </>
  )
}

export default FilterBox