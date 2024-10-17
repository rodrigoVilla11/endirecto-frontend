"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FiltersContextProps {
  order: string;
  setOrder: (value: string) => void;
  cart: string;
  setCart: (value: string) => void;
  showPurchasePrice: boolean;
  setShowPurchasePrice: (value: boolean) => void;
  tags: string[];
  setTags: (value: string[]) => void;
  stock: string;
  setStock: (value: string) => void;
  brand: string;
  setBrand: (value: string) => void;
  item: string;
  setItem: (value: string) => void;
  vehicleBrand: string;
  setVehicleBrand: (value: string) => void;
}

const FiltersContext = createContext<FiltersContextProps | undefined>(undefined);

export const FiltersProvider = ({ children }: { children: ReactNode }) => {
  const [order, setOrder] = useState('Best Sellers');
  const [cart, setCart] = useState('');
  const [showPurchasePrice, setShowPurchasePrice] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [stock, setStock] = useState('');
  const [brand, setBrand] = useState('');
  const [item, setItem] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');

  return (
    <FiltersContext.Provider value={{
      order,
      setOrder,
      cart,
      setCart,
      showPurchasePrice,
      setShowPurchasePrice,
      tags,
      setTags,
      stock,
      setStock,
      brand,
      setBrand,
      item,
      setItem,
      vehicleBrand,
      setVehicleBrand,
    }}>
      {children}
    </FiltersContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error('useFilters debe ser utilizado dentro de un FiltersProvider');
  }
  return context;
};
