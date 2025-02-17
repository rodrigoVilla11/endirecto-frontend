"use client";
import { useGetArticlesVehiclesQuery } from "@/redux/services/articlesVehicles";
import React from "react";
import { FaAngleDown } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

const VehiclesBrands = ({ onChange, vehicleBrand }: any) => {
  const { t } = useTranslation();
  const { data: vehiclesBrands } = useGetArticlesVehiclesQuery(null);

  const handleVehiclesBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  return (
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="vehiclesBrands"
        >
          {t("vehicleBrands")}
        </label>
        <div className="relative flex gap-1 justify-center items-center">
          <select
            id="vehiclesBrands"
            value={vehicleBrand}
            onChange={handleVehiclesBrandChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">{t("selectVehicleBrand")}</option>
            {vehiclesBrands?.map((item: any) => (
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
