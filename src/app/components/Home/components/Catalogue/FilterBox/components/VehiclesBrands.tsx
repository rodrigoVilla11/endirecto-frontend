"use client";
import { useGetArticlesVehiclesQuery } from "@/redux/services/articlesVehicles";
import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa6";

const VehiclesBrands = ({onChange} : any) => {
  const [selectedVehiclesBrand, setSelectedVehiclesBrand] = useState("");
  const { data: vehiclesBrands } = useGetArticlesVehiclesQuery(null);


  const handleVehiclesBrandChange = (event : any) => {
    const selectedValue = event.target.value;
    setSelectedVehiclesBrand(event.target.value);
    onChange(selectedValue)
  };

  return (
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="vehiclesBrands"
        >
          Vehicle&#39;s Brands
        </label>
        <div className="flex gap-1 justify-center items-center">
          <select
            id="vehiclesBrands"
            value={selectedVehiclesBrand}
            onChange={handleVehiclesBrandChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">
              Select a Vehicle&#39;s Brands
            </option>
            {vehiclesBrands?.map((item) => (
              <option key={item.id} value={item.brand}>
                {item.brand}
              </option>
            ))}
          </select>
          <FaAngleDown />
        </div>
      </div>
    </div>
  );
};

export default VehiclesBrands;
