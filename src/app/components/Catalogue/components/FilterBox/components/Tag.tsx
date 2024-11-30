"use client";
import React, { useState } from "react";

const Tag = ({ onSelectTags }: any) => {
  const [selectedItem, setSelectedItem] = useState("");

  const tags = ["Offers", "Promo", "New", "Kits"];
  const tagColors: Record<string, string> = {
    Offers: "#F2420A", // Red-orange
    Promo: "#00BF63", // Green
    New: "#FFBD59", // Yellow-orange
    Kits: "#F97316", // Orange
  };

  const handleButtonClick = (value: string) => {
    setSelectedItem(value);
    onSelectTags(value);
  };

  return (
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="cart"
        >
          Tag
        </label>
        <div className="flex justify-between items-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              className={`flex gap-1 items-center justify-center rounded-md w-1/2 py-2 font-semibold text-white`}
              onClick={() => handleButtonClick(tag)}
              style={{
                backgroundColor: tagColors[tag],
              }}
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
