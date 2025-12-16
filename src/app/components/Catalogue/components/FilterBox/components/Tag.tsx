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
    <div className="text-xs font-semibold text-white/80">
      <div className="mb-4">
        <label className="block text-white/70 font-extrabold mb-2 uppercase tracking-wide">
          {t("tag")}
        </label>

        <div className="grid grid-cols-4 gap-2">
          {tags.map((tag, index) => {
            const displayTag = displayMapping[tag] || tag;
            const label = t(displayTag) || displayTag;

            const isActive = selectedItem === tag;

            return (
              <button
                key={index}
                onClick={() => handleButtonClick(tag)}
                className={`
                flex gap-1 items-center justify-center
                rounded-2xl py-2 px-2
                font-extrabold text-[10px] sm:text-xs
                border transition-all duration-200
                ${
                  isActive
                    ? "opacity-100 scale-[1.02] shadow-xl"
                    : "opacity-80 hover:opacity-100"
                }
              `}
                style={{
                  backgroundColor: tagColors[tag],
                  borderColor: isActive
                    ? `${tagColors[tag]}80`
                    : "rgba(255,255,255,0.10)",
                }}
                title={label}
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
