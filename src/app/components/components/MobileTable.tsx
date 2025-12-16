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
          <div
            key={item.key}
            className="
            rounded-2xl overflow-hidden
            bg-white/5 backdrop-blur
            border border-white/10
            shadow-2xl
            hover:border-[#E10600]/35
            transition-all
          "
          >
            {/* Vista Compacta */}
            <div className="flex items-center justify-between p-3 bg-[#0B0B0B] border-b border-white/10">
              <div className="flex items-center gap-2">
                {/* Imagen del Producto */}
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  {item.image}
                </div>

                {/* Información Breve */}
                <div className="flex flex-col">
                  <p className="text-sm font-extrabold text-white">
                    {item.name}
                  </p>
                  <p className="text-xs text-white/50">{item.key}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Marca */}
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  {item.brand}
                </div>

                {/* Expandir Detalle */}
                <button
                  onClick={() =>
                    setExpandedItem(expandedItem === item.key ? null : item.key)
                  }
                  className="
                  p-2 rounded-xl
                  bg-white/5 border border-white/10
                  text-white
                  hover:bg-[#E10600] hover:border-[#E10600]
                  transition-all
                "
                  aria-label={expandedItem === item.key ? "Collapse" : "Expand"}
                >
                  {expandedItem === item.key ? "▲" : "▼"}
                </button>
              </div>
            </div>

            {/* Vista Expandida */}
            {expandedItem === item.key && (
              <div className="p-4 bg-[#0B0B0B] text-white space-y-3">
                {/* Imagen Grande */}
                <div className="flex justify-center rounded-2xl bg-white/5 border border-white/10 p-3">
                  {item.image}
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/60">{t("brandLabel")}:</span>
                    <span className="font-semibold text-white">
                      {item.brand}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/60">{t("stockLabel")}:</span>
                    <span className="text-white/80">{item.stock}</span>
                  </div>

                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/60">{t("netPriceLabel")}:</span>
                    <span className="font-extrabold text-white">
                      {item.price}
                    </span>
                  </div>

                  {/* Cantidad Editable */}
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/60">{t("quantityLabel")}:</span>
                    <span className="text-white/80">{item.quantity}</span>
                  </div>

                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/60">{t("totalLabel")}:</span>
                    <span className="font-extrabold text-white">
                      {item.total}
                    </span>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex justify-between items-center mt-3 gap-3">
                  <button
                    onClick={() => handleModalOpen("update", item.key)}
                    className="
                    flex-1
                    bg-white/5 border border-white/10
                    hover:bg-white/10
                    p-2 rounded-xl
                    text-xs font-bold text-white
                    flex items-center justify-center gap-2
                    transition-all
                  "
                  >
                    <FaSearch className="w-4 h-4" /> {t("detailsButton")}
                  </button>

                  <button
                    onClick={() =>
                      handleRemoveItem && handleRemoveItem(item.key)
                    }
                    className="
                    flex-1
                    bg-[#E10600]
                    hover:opacity-90
                    p-2 rounded-xl
                    text-xs font-bold text-white
                    flex items-center justify-center gap-2
                    shadow-lg
                    transition-all
                  "
                  >
                    <FaTrashCan className="w-4 h-4" /> {t("deleteButton")}
                  </button>
                </div>

                {/* Acento marca */}
                <div className="mt-2 h-0.5 w-20 bg-[#E10600] opacity-80 rounded-full" />
              </div>
            )}

            {/* Firma */}
            <div className="h-1 w-full bg-[#E10600] opacity-90" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileTable;
