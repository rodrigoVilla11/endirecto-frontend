import React from "react";
import { FaTrashCan, FaXmark } from "react-icons/fa6";
import Order from "./components/Order";
import Cart from "./components/Cart";
import PurchasePrice from "./components/PurchasePrice";
import Tag from "./components/Tag";
import Stock from "./components/Stock";
import Brands from "./components/Brands";
import Items from "./components/Items";
import VehiclesBrands from "./components/VehiclesBrands";
import { useFilters } from "@/app/context/FiltersContext";
import { useGetBrandByIdQuery } from "@/redux/services/brandsApi";
import { useGetItemByIdQuery } from "@/redux/services/itemsApi";
import { useMobile } from "@/app/context/ResponsiveContext";

const FilterBox = ({ isVisible, onClose }: any) => {
  const {
    setOrder,
    order,
    setCart,
    cart,
    setShowPurchasePrice,
    showPurchasePrice,
    setTags,
    tags,
    setStock,
    stock,
    setBrand,
    brand,
    setItem,
    item,
    setVehicleBrand,
    vehicleBrand,
    setSearch,
    search
  } = useFilters();
  const { isMobile } = useMobile();

  
  const { data: dataBrand } = useGetBrandByIdQuery({ id: brand });
  const { data: dataItem } = useGetItemByIdQuery({ id: item });
  const formatStock = (stock: any) => {
    if (stock === "stock:desc") {
      return "STOCK";
    }
    if (stock !== "stock:desc") {
      return "NO-STOCK";
    }
    return "N/A";
  };

  const formattedStock = formatStock(stock);

  const handleStockChange = (value: string) => {
    setStock(value);
  };
  
  return (
    <>
    {isVisible && (
      <div className={`${isMobile ? "w-112" : "w-64"} bg-white rounded-lg shadow-lg h-[655px]`}>
        {/* Header with close button */}
        <div className="p-2 flex justify-end items-center border-b">
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <FaXmark className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Applied Filters Section */}
        {(tags.length > 0 || brand || item || vehicleBrand || stock || search) && (
          <div className="px-4 py-2 border-b">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Filters Applied</h3>
            <div className="flex flex-wrap gap-2">
              {tags.length > 0 && (
                <div className="bg-gray-100 rounded-full py-1 px-3 text-xs relative group">
                  {tags}
                  <button className="ml-2 text-red-500 opacity-90 hover:opacity-100" onClick={() => setTags([])}>
                    <FaTrashCan className="w-3 h-3" />
                  </button>
                </div>
              )}
              {search && search !== "" && (
                <div className="bg-gray-100 rounded-full py-1 px-3 text-xs relative group">
                  {search}
                  <button className="ml-2 text-red-500 opacity-90 hover:opacity-100" onClick={() => setSearch("")}>
                    <FaTrashCan className="w-3 h-3" />
                  </button>
                </div>
              )}
              {brand && brand !== "" && (
                <div className="bg-gray-100 rounded-full py-1 px-3 text-xs relative group">
                  {dataBrand?.name}
                  <button className="ml-2 text-red-500 opacity-90 hover:opacity-100" onClick={() => setBrand("")}>
                    <FaTrashCan className="w-3 h-3" />
                  </button>
                </div>
              )}
              {item && item !== "" && (
                <div className="bg-gray-100 rounded-full py-1 px-3 text-xs relative group">
                  {dataItem?.name}
                  <button className="ml-2 text-red-500 opacity-90 hover:opacity-100" onClick={() => setItem("")}>
                    <FaTrashCan className="w-3 h-3" />
                  </button>
                </div>
              )}
              {vehicleBrand && vehicleBrand !== "" && (
                <div className="bg-gray-100 rounded-full py-1 px-3 text-xs relative group">
                  {vehicleBrand}
                  <button
                    className="ml-2 text-red-500 opacity-90 hover:opacity-100"
                    onClick={() => setVehicleBrand("")}
                  >
                    <FaTrashCan className="w-3 h-3" />
                  </button>
                </div>
              )}
              {stock && stock !== "" && (
                <div className="bg-gray-100 rounded-full py-1 px-3 text-xs relative group">
                  {formattedStock}
                  <button className="ml-2 text-red-500 opacity-90 hover:opacity-100" onClick={() => setStock("")}>
                    <FaTrashCan className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Components */}
        <div className="space-y-2 p-4">
          <Order onChange={setOrder} />
          <PurchasePrice onToggle={setShowPurchasePrice} />
          <Tag onSelectTags={setTags} />
          <Stock onChange={handleStockChange} />
          <Brands onChange={setBrand} brand={brand} />
          <Items onChange={setItem} item={item} />
          <VehiclesBrands onChange={setVehicleBrand} vehicleBrand={vehicleBrand} />
        </div>
      </div>
    )}
  </>
)
};

export default FilterBox;
