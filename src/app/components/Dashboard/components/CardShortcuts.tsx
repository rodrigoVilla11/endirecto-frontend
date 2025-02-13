import React from "react";

const CardShortcuts = ({ title, logo }: any) => {
  return (
    <button
    className={`
      h-24 w-[350px] sm:w-72
      flex items-center justify-between
      bg-white rounded-lg shadow-md
      p-4 hover:bg-gray-50 transition-colors
    `}
  >
    <span className="text-lg font-medium text-gray-900">{title}</span>
    <span className="text-2xl">{logo}</span>
  </button>
  );
};

export default CardShortcuts;
