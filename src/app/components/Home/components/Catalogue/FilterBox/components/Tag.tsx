"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const Tag = ({ onSelectTags }: any) => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState("");

  const handleButtonClick = (value: string) => {
    setSelectedItem(value);
    onSelectTags(value);
  };

  const tags = ["OFFER", "OUTLET", "NEW", "COMBO"];

  return (
    <div className="px-4 text-sm">
      <div className="mb-4">
        <label
          htmlFor="tags"
          className="block text-white/80 text-sm font-extrabold mb-2"
        >
          {t("tagLabel")}
        </label>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleButtonClick(tag)}
              className={`
              flex-1 min-w-[45%]
              flex items-center justify-center
              py-2 rounded-xl
              border
              font-bold text-xs sm:text-sm
              transition-all duration-200
              ${
                selectedItem === tag
                  ? "bg-[#E10600] text-white border-[#E10600]"
                  : "bg-white/5 text-white/70 border-white/10 hover:border-[#E10600]/40 hover:bg-white/10"
              }
            `}
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
