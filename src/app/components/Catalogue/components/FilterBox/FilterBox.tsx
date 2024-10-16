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
import { useFilters } from '@/app/context/FiltersContext';

const FilterBox = ({ isVisible, onClose }: any) => {
  const { setOrder, setCart, setShowPurchasePrice, setTags, setStock, setBrand, setItem, setVehicleBrand } = useFilters();

  return (
    <>
      {isVisible && (
        <div className='w-112 h-auto shadow-2xl rounded-md bg-white pb-4'>
          <div className='p-2 flex justify-end items-center text-2xl'>
            <button onClick={onClose}><FaXmark /></button>
          </div>
          <Order onChange={setOrder} />
          <Cart onChange={setCart} />
          <PurchasePrice onToggle={setShowPurchasePrice} />
          <Tag onSelectTags={setTags} />
          <Stock onChange={setStock} />
          <Brands onChange={setBrand} />
          <Items onChange={setItem} />
          <VehiclesBrands onChange={setVehicleBrand} />
        </div>
      )}
    </>
  )
}

export default FilterBox