import React from "react";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface ItemDetailProps {
  data: any; // Objeto completo del ítem
  onClose: () => void;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ data, onClose }) => {
  const { t } = useTranslation();

  if (!data) return null;

  return (
    <div className="p-4 bg-white rounded-2xl">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-xl font-bold">{data.name}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FaTimes className="w-6 h-6" />
        </button>
      </div>
      <div className="space-y-2">
        <p>
          <span className="font-semibold">{t("table.id")}:</span> {data.id}
        </p>
        <p>
          <span className="font-semibold">{t("table.name")}:</span> {data.name}
        </p>
        <p>
          <span className="font-semibold">{t("page.image")}:</span>{" "}
          {data.image ? (
            <img
              src={data.image}
              alt={data.name}
              className="h-10 w-auto object-contain"
            />
          ) : (
            t("page.noImage")
          )}
        </p>
        {data.description && (
          <p>
            <span className="font-semibold">{t("table.description")}:</span>{" "}
            {data.description}
          </p>
        )}
        {/* Agrega aquí más detalles del ítem según lo requieras */}
      </div>
    </div>
  );
};

export default ItemDetail;
