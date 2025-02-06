import { useGetBrandByIdQuery } from "@/redux/services/brandsApi";
import { useGetItemByIdQuery } from "@/redux/services/itemsApi";
import React from "react";

const TableInfo = ({article} : any) => {
  return (
    <div className="">
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Code</p>
        <p className="font-light">BUSCAR BIEN</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Supplier Code</p>
        <p className="font-light">{article.supplier_code}</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Brand</p>
        <p className="font-light">{article?.brand.name || "N/A"}</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Item</p>
        <p className="font-light max-w-40">{article?.brand.name || "N/A"}</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Description</p>
        <p className="font-light max-w-40">{article.description}</p>
      </div>
      <hr />
    </div>
  );
};

export default TableInfo;
