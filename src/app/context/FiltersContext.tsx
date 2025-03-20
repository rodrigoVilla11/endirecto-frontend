"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";

interface FiltersContextProps {
  order: string;
  setOrder: (value: string) => void;
  cart: string;
  setCart: (value: string) => void;
  showPurchasePrice: boolean;
  setShowPurchasePrice: (value: boolean) => void;
  tags: string;
  setTags: (value: string) => void;
  stock: string;
  setStock: (value: string) => void;
  brand: string;
  setBrand: (value: string) => void;
  item: string;
  setItem: (value: string) => void;
  vehicleBrand: string;
  setVehicleBrand: (value: string) => void;
  engine: string;
  setEngine: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
}

const FiltersContext = createContext<FiltersContextProps | undefined>(
  undefined
);

export const FiltersProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [order, setOrder] = useState("");
  const [cart, setCart] = useState("");
  const [showPurchasePrice, setShowPurchasePrice] = useState(true);
  const [tags, setTags] = useState("");
  const [stock, setStock] = useState("");
  const [brand, setBrand] = useState("");
  const [item, setItem] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [engine, setEngine] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");

  // Memorizamos el valor para evitar renders innecesarios
  const value = useMemo(
    () => ({
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
      engine,
      setEngine,
      model,
      setModel,
      year,
      setYear,
      search,
      setSearch,
    }),
    [order, cart, showPurchasePrice, tags, stock, brand, item, vehicleBrand, engine, model, year, search]
  );

  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
};

export const useFilters = (): FiltersContextProps => {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error(
      "useFilters debe ser utilizado dentro de un FiltersProvider"
    );
  }
  return context;
};
