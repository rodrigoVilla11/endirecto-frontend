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
  } = useFilters();


  const { data: dataBrand } = useGetBrandByIdQuery({ id: brand })
  const { data: dataItem } = useGetItemByIdQuery({ id: item })

  return (
    <>
      {isVisible && (
        <div className="w-112 h-auto shadow-2xl rounded-md bg-white pb-4">
          <div className="p-2 flex justify-end items-center text-2xl">
            <button onClick={onClose}>
              <FaXmark />
            </button>
          </div>
          {(tags.length > 0 || brand || item || vehicleBrand) && (
            <div className="px-4 text-sm">
              <h3 className="block text-gray-700 text-sm font-bold mb-2">
                Filters Applied
              </h3>
              <div className="flex gap-2">
                {tags.length > 0 && (
                  <div className="bg-gray-200 rounded-md p-1 relative m-1">
                    {tags}
                    <button
                      className="absolute top-0 right-0 text-red-500"
                      onClick={() => setTags([])}
                    >
                      <FaTrashCan />
                    </button>
                  </div>
                )}
                {brand && brand !== "" && (
                  <div className="bg-gray-200 rounded-md p-1 relative m-1">
                    {dataBrand?.name}
                    <button
                      className="absolute top-0 right-0 text-red-500"
                      onClick={() => setBrand("")}
                    >
                      <FaTrashCan />
                    </button>
                  </div>
                )}
                {item && item !== "" && (
                  <div className="bg-gray-200 rounded-md p-1 relative m-1">
                    {dataItem?.name}
                    <button
                      className="absolute top-0 right-0 text-red-500"
                      onClick={() => setItem("")}
                    >
                      <FaTrashCan />
                    </button>
                  </div>
                )}
                {vehicleBrand && vehicleBrand !== "" && (
                  <div className="bg-gray-200 rounded-md p-1 relative m-1">
                    {vehicleBrand}
                    <button
                      className="absolute top-0 right-0 text-red-500"
                      onClick={() => setVehicleBrand("")}
                    >
                      <FaTrashCan />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <Order onChange={setOrder} />
          <Cart onChange={setCart} />
          <PurchasePrice onToggle={setShowPurchasePrice} />
          <Tag onSelectTags={setTags} />
          <Stock onChange={setStock} />
          <Brands onChange={setBrand} brand={brand} />
          <Items onChange={setItem} item={item} />
          <VehiclesBrands
            onChange={setVehicleBrand}
            vehicleBrand={vehicleBrand}
          />
        </div>
      )}
    </>
  );
};

export default FilterBox;
