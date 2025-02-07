"use client";
import { useGetArticlesVehiclesQuery } from "@/redux/services/articlesVehicles";
import React, { useState, useEffect } from "react";
import { FaAngleDown } from "react-icons/fa6";

const VehiclesBrands = ({ onChange, vehicleBrand }: any) => {
  const [selectedVehiclesBrand, setSelectedVehiclesBrand] = useState("");
  const { data: vehiclesBrands } = useGetArticlesVehiclesQuery(null);

  // Sincronizar el estado con la prop 'vehicleBrand'
  useEffect(() => {
    if (!vehicleBrand) {
      setSelectedVehiclesBrand(""); // Si 'vehicleBrand' es falsy, resetea el estado
    } else {
      setSelectedVehiclesBrand(vehicleBrand); // Si 'vehicleBrand' tiene un valor, asignarlo al estado
    }
  }, [vehicleBrand]);

  const handleVehiclesBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedVehiclesBrand(selectedValue); // Actualiza el estado
    onChange(selectedValue); // Llama a onChange con el nuevo valor
  };

  return (
    <div className="text-xs font-semibold">
      <div className="mb-4">
        <label
          className="block text-gray-700 font-bold mb-2"
          htmlFor="vehiclesBrands"
        >
          Vehicle&#39;s Brands
        </label>
        <div className="relative flex gap-1 justify-center items-center">
          <select
            id="vehiclesBrands"
            value={selectedVehiclesBrand}
            onChange={handleVehiclesBrandChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a Vehicle&#39;s Brands</option>
            {vehiclesBrands?.map((item) => (
              <option key={item.id} value={item.brand}>
                {item.brand}
              </option>
            ))}
          </select>
          <FaAngleDown className="absolute right-3 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default VehiclesBrands;
