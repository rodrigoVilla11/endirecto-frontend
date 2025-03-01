"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const Tag = ({ onSelectTags }: any) => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState("");

  const tags = ["OFFER", "OUTLET", "NEW", "COMBO"];
  const tagColors: Record<string, string> = {
    OFFER: "#F2420A", // Red-orange
    OUTLET: "#00BF63", // Green
    NEW: "#FFBD59", // Yellow-orange
    COMBO: "#F97316" // Orange
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
          {tags.map((tag, index) => (
            <button
              key={index}
              className="flex gap-1 items-center justify-center rounded-md py-1 px-2 font-semibold text-white"
              onClick={() => handleButtonClick(tag)}
              style={{ backgroundColor: tagColors[tag] }}
            >
              {t(tag)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tag;
