import React from "react";
import { FaPencil, FaTrashCan } from "react-icons/fa6";

interface Article {
  key: string | number;
  brand: string;
  image: React.ReactNode;
  pdf?: string[];
  item: string;
  id: string ;
  supplier: string;
  name: string;
  edit: React.ReactNode;
}

interface MobileTableProps {
  data: Article[];
  handleModalOpen: (action: "update" | "delete", id: string ) => void;
}

const MobileTable: React.FC<MobileTableProps> = ({ data, handleModalOpen }) => {
  const validData = Array.isArray(data) ? data : [];

  return (
    <div className="flex-grow m-5 bg-white flex flex-col text-xs">
      <div className="w-full h-full space-y-4">
        {validData.map((item) => (
          <div 
            key={item.key}
            className="border border-gray-200 rounded-lg shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between bg-black text-white p-3">
              <h2 className="text-sm font-medium">ARTICULO #{item.id}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleModalOpen("update", item.id)}
                  className="bg-emerald-500 hover:bg-emerald-600 p-1.5 rounded w-7 h-7 flex items-center justify-center"
                >
                  <FaPencil className="w-3.5 h-3.5" />
                  <span className="sr-only">Editar</span>
                </button>
                <button 
                  onClick={() => handleModalOpen("delete", item.id)}
                  className="bg-red-500 hover:bg-red-600 p-1.5 rounded w-7 h-7 flex items-center justify-center"
                >
                  <FaTrashCan className="w-3.5 h-3.5" />
                  <span className="sr-only">Eliminar</span>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Image */}
              <div className="flex justify-center">
                {item.image}
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Nombre:</div>
                  <div className="font-medium">{item.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Marca:</div>
                  <div className="font-medium">{item.brand}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Item:</div>
                  <div className="font-medium">{item.item}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Proveedor:</div>
                  <div className="font-medium">{item.supplier}</div>
                </div>

                {item.pdf && item.pdf.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">PDFs:</div>
                    <div className="font-medium">{item.pdf.length} archivos</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileTable;
