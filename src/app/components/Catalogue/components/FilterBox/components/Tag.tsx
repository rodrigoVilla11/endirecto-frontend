"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface TagProps {
  onSelectTags: (value: string) => void;
}

const Tag: React.FC<TagProps> = ({ onSelectTags }) => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState("");

  const tags = ["OFFER", "OUTLET", "NEW", "COMBO"];
  const tagColors: Record<string, string> = {
    OFFER: "#F2420A", // Red-orange
    OUTLET: "#00BF63", // Green
    NEW: "#FFBD59", // Yellow-orange
    COMBO: "#F97316", // Orange
  };

  // Mapeo para la etiqueta a mostrar, manteniendo el valor para búsqueda
  const displayMapping: Record<string, string> = {
    OUTLET: "Promos",
    COMBO: "Kits",
  };

  const handleButtonClick = (value: string) => {
    setSelectedItem(value);
    onSelectTags(value);
  };

  return (
    <div className="text-xs font-semibold">
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="cart">
          {t("tag")}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {tags.map((tag, index) => {
            const displayTag = displayMapping[tag] || tag;
            const label = t(displayTag) || displayTag;
            return (
              <button
                key={index}
                className={`flex gap-1 items-center justify-center rounded-md py-1 px-2 font-semibold text-white ${
                  selectedItem === tag ? "opacity-100" : "opacity-75"
                }`}
                onClick={() => handleButtonClick(tag)}
                style={{ backgroundColor: tagColors[tag] }}
              >
                {label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tag;
