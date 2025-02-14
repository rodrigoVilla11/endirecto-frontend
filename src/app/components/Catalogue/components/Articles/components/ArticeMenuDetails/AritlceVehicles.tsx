import React, { useState } from "react";
import { X } from "lucide-react";
import { useGetArticleEquivalenceByArticleIdQuery } from "@/redux/services/articlesEquivalences";

type ArticleEquivalenceProps = {
    articleVehicles: any;
  closeModal: () => void;
};

const ArticleVehicle = ({ articleVehicles, closeModal }: ArticleEquivalenceProps) => {
    console.log(articleVehicles)
  return (
    <div className="w-128 z-50 mt-10">
      <div className="flex items-center justify-between p-4 bg-gray-100 rounded-t-lg">
          <h2 className="text-lg font-medium">Aplicaciones por Articulo</h2>
          <button
            onClick={closeModal}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <table className="min-w-full bg-white">
      <thead>
        <tr className="text-xs">
          <th className="py-2 px-4 bg-gray-200 text-left">Brand</th>
          <th className="py-2 px-4 bg-gray-200 text-left">Engine</th>
          <th className="py-2 px-4 bg-gray-200 text-left">Model</th>
          <th className="py-2 px-4 bg-gray-200 text-left">Year</th>

        </tr>
      </thead>
      <tbody className="text-xs">
      {articleVehicles && Array.isArray(articleVehicles) && articleVehicles.map((vehicle: any) => (
          <tr key={vehicle.id}>
            <td className="border-t py-2 px-4">
             {vehicle.brand}
            </td>
            <td className="border-t py-2 px-4 max-w-44">
              {vehicle.engine}
            </td>
            <td className="border-t py-2 px-4 max-w-44">
              {vehicle.model}
            </td><td className="border-t py-2 px-4 max-w-44">
              {vehicle.year}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
};

export default ArticleVehicle;
