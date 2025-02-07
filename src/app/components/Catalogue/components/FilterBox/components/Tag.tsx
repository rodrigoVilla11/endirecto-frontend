"use client";
import React, { useState } from "react";

const Tag = ({ onSelectTags }: any) => {
  const [selectedItem, setSelectedItem] = useState("");

  const tags = ["OFFER", "OUTLET", "NEW", "COMBO"];
  const tagColors: Record<string, string> = {
    OFFER: "#F2420A", // Red-orange
    OUTLET: "#00BF63", // Green
    NEW: "#FFBD59", // Yellow-orange
    COMBO: "#F97316", // Orange
  };

  const handleButtonClick = (value: string) => {
    setSelectedItem(value);
    onSelectTags(value);
  };

  return (
    <div className="text-xs font-semibold">
    <div className="mb-4">
      <label
        className="block text-gray-700 font-bold mb-2"
        htmlFor="cart"
      >
        Tag
      </label>
      <div className="grid grid-cols-2 gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            className="flex gap-1 items-center justify-center rounded-md py-2 font-semibold text-white"
            onClick={() => handleButtonClick(tag)}
            style={{ backgroundColor: tagColors[tag] }}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  </div>
  
  );
};

export default Tag;
