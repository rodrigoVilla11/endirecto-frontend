"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IoIosArrowDown } from "react-icons/io";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { GoDotFill } from "react-icons/go";
import { AiFillCaretDown } from "react-icons/ai";

interface Icon {
  icon: React.ReactNode;
  name: string;
  path?: string;
  subCategories?: { name: string; path: string }[];
  onClick?: () => void;
}

interface ButtonsIconsProps {
  icon: Icon;
  isOpen: boolean;
  openSubCategory: string | null;
  setOpenSubCategory: (name: string | null) => void;
}

const ButtonsIcons: React.FC<ButtonsIconsProps> = ({
  icon,
  isOpen,
  openSubCategory,
  setOpenSubCategory,
}) => {
  const { setIsOpen } = useSideMenu();
  const router = useRouter();

  const toggleSubCategories = () => {
    setIsOpen(true);
    if (openSubCategory === icon.name) {
      setOpenSubCategory(null);
    } else {
      setOpenSubCategory(icon.name);
    }
  };

  const handleRedirect = (path: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (path) {
      // setIsOpen(false);
      setOpenSubCategory(null);
      router.push(path);
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    if (icon.onClick) {
      event.stopPropagation();
      icon.onClick();
    } else if (icon.subCategories) {
      toggleSubCategories();
    } else {
      handleRedirect(icon.path || "", event);
    }
  };

  const showSubCategories = openSubCategory === icon.name;

  return (
    <div
      className="relative flex items-center text-xl text-white group"
      onClick={handleClick}
    >
      {!isOpen ? (
        <div className="flex items-center text-center flex-col cursor-pointer">
          <div className="relative z-10">{icon.icon}</div>
          <div className="relative z-10 text-xs">{icon.name}</div>
          {icon.subCategories && (
            <AiFillCaretDown 
              className="text-sm cursor-pointer"
              onClick={() => setIsOpen(true)}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="text-left hover:cursor-pointer">{icon.icon}</div>
            <div className="text-sm hover:cursor-pointer">{icon.name}</div>
            {icon.subCategories && (
              <AiFillCaretDown className="text-sm cursor-pointer" />
            )}
          </div>
          {isOpen && icon.subCategories && (
            <div
              className={`bg-header-color rounded-md px-2 w-48 text-start transition-all duration-300 ${
                showSubCategories
                  ? "max-h-60 opacity-100"
                  : "max-h-0 opacity-0 overflow-hidden"
              }`}
            >
              <ul>
                {icon.subCategories.map((subcategory, index) => (
                  <li
                    key={index}
                    className="text-sm p-1 hover:cursor-pointer text-center"
                    onClick={(event) => handleRedirect(subcategory.path, event)}
                  >
                    <div className="flex gap-1 text-center text-xs">
                     {subcategory.name}
                    </div>
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
