import React, { useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
import ButtonOnOff from "@/app/components/components/ButtonOnOff";
import { FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface MobileTableProps {
  data: any[];
  handleModalOpen: (action: "update" | "delete", id: string) => void;
  handleQuantityChange?: (id: string, quantity: number) => void;
  handleRemoveItem?: (id: string) => void;
  shopping_cart?: boolean;
}

const MobileTable: React.FC<MobileTableProps> = ({
  data,
  handleModalOpen,
  handleQuantityChange,
  handleRemoveItem,
  shopping_cart = false,
}) => {
  const { t } = useTranslation();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  return (
    <div className="flex-grow m-5 flex flex-col text-xs">
      <div className="w-full h-full space-y-4">
        {data.map((item) => (
          <div key={item.key} className="border border-gray-600 rounded-lg shadow-sm overflow-hidden">
            {/* Vista Compacta */}
            <div className="flex items-center justify-between bg-white text-black p-3">
              <div className="flex items-center gap-2">
                {/* Imagen del Producto */}
                <div className="w-12 h-12 flex items-center justify-center">{item.image}</div>
                {/* Información Breve */}
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.key}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Marca */}
                <div className="w-10 h-10 flex items-center justify-center">{item.brand}</div>
                {/* Expandir Detalle */}
                <button
                  onClick={() =>
                    setExpandedItem(expandedItem === item.key ? null : item.key)
                  }
                  className="p-2 text-black"
                >
                  {expandedItem === item.key ? "▲" : "▼"}
                </button>
              </div>
            </div>

            {/* Vista Expandida */}
            {expandedItem === item.key && (
              <div className="p-4 bg-white text-black space-y-3">
                {/* Imagen Grande */}
                <div className="flex justify-center">{item.image}</div>

                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">{t("brandLabel")}:</span>
                    <span className="font-medium">{item.brand}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">{t("stockLabel")}:</span>
                    <span>{item.stock}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">{t("netPriceLabel")}:</span>
                    <span className="font-medium">{item.price}</span>
                  </div>
                  {/* Cantidad Editable */}
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">{t("quantityLabel")}:</span>
                    <input
                      type="number"
                      value={item.quantity}
                      className="w-16 text-center border rounded-md text-xs p-1"
                      min={1}
                      onChange={(e) =>
                        handleQuantityChange &&
                        handleQuantityChange(item.key, parseInt(e.target.value))
                      }
                    />
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">{t("totalLabel")}:</span>
                    <span className="font-medium">{item.total}</span>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex justify-between items-center mt-3">
                  <button
                    onClick={() => handleModalOpen("update", item.key)}
                    className="bg-emerald-500 hover:bg-emerald-600 p-2 rounded text-xs flex items-center gap-2"
                  >
                    <FaSearch className="w-4 h-4" /> {t("detailsButton")}
                  </button>
                  <button
                    onClick={() =>
                      handleRemoveItem && handleRemoveItem(item.key)
                    }
                    className="bg-red-500 hover:bg-red-600 p-2 rounded text-xs flex items-center gap-2"
                  >
                    <FaTrashCan className="w-4 h-4" /> {t("deleteButton")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileTable;
