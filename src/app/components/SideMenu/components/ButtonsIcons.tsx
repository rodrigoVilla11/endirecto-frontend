"use client";
"use client";
import React, { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";

const ButtonsIcons = ({ icon, isOpen }: any) => {
  const [showSubCategories, setShowSubCategories] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleSubCategories = () => {
    setShowSubCategories(!showSubCategories);
  };

  return (
    <button
      className="relative flex items-center text-2xl text-white group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={toggleSubCategories}
    >
      {!isOpen ? (
        <div className="flex items-center">
          {isHovered && icon.subCategories ? (
            <div className="absolute left-full bg-header-color text-white text-lg p-2 rounded-l-md w-44 ml-6 text-start">
              <ul>
                {icon.name}
                {icon.subCategories.map((subcategory: string, index: number) => (
                  <li key={index} className="text-sm p-1">
                    {subcategory}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            isHovered && (
              <div className="absolute left-full bg-header-color text-white text-lg p-2 rounded-l-md w-44 ml-6 text-start">
                {icon.name}
              </div>
            )
          )}
          <div className="relative z-10">{icon.icon}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="text-left">{icon.icon}</div>
            <div className="text-sm">{icon.name}</div>
            {icon.subCategories && (
              <IoIosArrowDown className="text-sm cursor-pointer" />
            )}
          </div>
          {isOpen && showSubCategories && (
            <div className="bg-header-color rounded-md p-2 w-48 text-start">
              <ul>
                {icon.subCategories.map((subcategory: string, index: number) => (
                  <li key={index} className="text-sm p-1">
                    {subcategory}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </button>
  );
};

export default ButtonsIcons;
