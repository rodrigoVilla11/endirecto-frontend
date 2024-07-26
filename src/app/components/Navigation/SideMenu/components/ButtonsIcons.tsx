"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IoIosArrowDown } from "react-icons/io";

const ButtonsIcons = ({ icon, isOpen }: any) => {
  const router = useRouter();
  const [showSubCategories, setShowSubCategories] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleSubCategories = () => {
    setShowSubCategories(!showSubCategories);
  };

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  return (
    <div
      className="relative flex items-center text-2xl text-white group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={icon.subCategories ? toggleSubCategories : () => handleRedirect(icon.path)}
    >
      {!isOpen ? (
        <div className="flex items-center">
          {isHovered && icon.subCategories ? (
            <div className="absolute left-full bg-header-color text-white text-lg p-2 rounded-l-md w-44 ml-6 text-start ">
              <ul>
                {icon.name}
                {icon.subCategories.map((subcategory: any, index: number) => (
                  <li key={index} className="text-sm p-1 hover:cursor-pointer" onClick={() => handleRedirect(subcategory.path)}>
                    {subcategory.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            isHovered && (
              <div className="absolute left-full bg-header-color text-white text-lg p-2 rounded-l-md w-44 ml-6 text-start hover:cursor-pointer">
                {icon.name}
              </div>
            )
          )}
          <div className="relative z-10">{icon.icon}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="text-left hover:cursor-pointer">{icon.icon}</div>
            <div className="text-sm hover:cursor-pointer">{icon.name}</div>
            {icon.subCategories && (
              <IoIosArrowDown className="text-sm cursor-pointer" />
            )}
          </div>
          {isOpen && showSubCategories && (
            <div className="bg-header-color rounded-md p-2 w-48 text-start">
              <ul>
                {icon.subCategories.map((subcategory: any, index: number) => (
                  <li key={index} className="text-sm p-1 hover:cursor-pointer" onClick={() => handleRedirect(subcategory.path)}>
                    {subcategory.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ButtonsIcons;
