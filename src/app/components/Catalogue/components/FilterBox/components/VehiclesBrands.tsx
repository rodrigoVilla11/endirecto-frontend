"use client";
import { useGetArticlesVehiclesQuery, useGetArticleVehicleBrandsQuery } from "@/redux/services/articlesVehicles";
import React, { useState, useEffect } from "react";
import { FaAngleDown } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

const VehiclesBrands = ({ onChange, vehicleBrand }: any) => {
  const { t } = useTranslation();
  const [selectedVehiclesBrand, setSelectedVehiclesBrand] = useState("");
  const { data: vehiclesBrands } = useGetArticleVehicleBrandsQuery(null);

  // Sincronizar el estado con la prop 'vehicleBrand'
  useEffect(() => {
    if (!vehicleBrand) {
      setSelectedVehiclesBrand("");
    } else {
      setSelectedVehiclesBrand(vehicleBrand);
    }
  }, [vehicleBrand]);

  const handleVehiclesBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedVehiclesBrand(selectedValue);
    onChange(selectedValue);
  };

  return (
    <div className="text-xs font-semibold">
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="vehiclesBrands">
          {t("vehicleBrands")}
        </label>
        <div className="relative flex gap-1 justify-center items-center">
          <select
            id="vehiclesBrands"
            value={selectedVehiclesBrand}
            onChange={handleVehiclesBrandChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">{t("selectVehicleBrands")}</option>
            {vehiclesBrands?.brands.map((item: any, index: any) => (
              <option key={index} value={item}>
                {item}
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
