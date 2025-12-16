import { useGetBrandByIdQuery } from "@/redux/services/brandsApi";
import { useGetItemByIdQuery } from "@/redux/services/itemsApi";
import React from "react";

const TableInfo = ({ article }: any) => {
  return (
    <div className="space-y-2 text-sm">
      {/* Row */}
      <div className="flex justify-between items-start p-2 rounded-xl hover:bg-white/5 transition-colors">
        <p className="font-extrabold text-white/80">Code</p>
        <p className="text-white text-right">BUSCAR BIEN</p>
      </div>
      <div className="h-px bg-white/10" />

      <div className="flex justify-between items-start p-2 rounded-xl hover:bg-white/5 transition-colors">
        <p className="font-extrabold text-white/80">Supplier Code</p>
        <p className="text-white/70 text-right">{article.supplier_code}</p>
      </div>
      <div className="h-px bg-white/10" />

      <div className="flex justify-between items-start p-2 rounded-xl hover:bg-white/5 transition-colors">
        <p className="font-extrabold text-white/80">Brand</p>
        <p className="text-white/70 text-right">
          {article?.brand?.name || "N/A"}
        </p>
      </div>
      <div className="h-px bg-white/10" />

      <div className="flex justify-between items-start p-2 rounded-xl hover:bg-white/5 transition-colors">
        <p className="font-extrabold text-white/80">Item</p>
        <p className="text-white/70 text-right max-w-40 truncate">
          {article?.item?.name || "N/A"}
        </p>
      </div>
      <div className="h-px bg-white/10" />

      <div className="flex justify-between items-start p-2 rounded-xl hover:bg-white/5 transition-colors">
        <p className="font-extrabold text-white/80">Description</p>
        <p className="text-white/70 text-right max-w-40 line-clamp-2">
          {article.description}
        </p>
      </div>
    </div>
  );
};

export default TableInfo;
