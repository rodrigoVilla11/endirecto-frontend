"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IoIosArrowDown } from "react-icons/io";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { GoDotFill } from "react-icons/go";

const ButtonsIcons = ({ icon, isOpen }: any) => {
  const { setIsOpen } = useSideMenu();
  const router = useRouter();
  const [showSubCategories, setShowSubCategories] = useState(false);

  const toggleSubCategories = () => {
    setShowSubCategories(!showSubCategories);
  };

  const handleRedirect = (path: string, event: React.MouseEvent<Element, MouseEvent>) => {
    event.stopPropagation();
    if (path) {
      router.push(path);
    }
  };

  return (
    <div
      className="relative flex items-center text-2xl text-white group"
      onClick={icon.subCategories ? toggleSubCategories : () => handleRedirect(icon.path, new MouseEvent('click'))}
    >
      {!isOpen ? (
        <div className="flex items-center text-center flex-col cursor-pointer">
          <div className="relative z-10">{icon.icon}</div>
          <div className="relative z-10 text-xs">{icon.name}</div>
          {icon.subCategories && (
            <IoIosArrowDown className="text-sm cursor-pointer" onClick={() => setIsOpen(true)} />
          )}
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
            <div className="bg-header-color rounded-md px-2 w-48 text-start">
              <ul>
                {icon.subCategories.map((subcategory: any, index: number) => (
                  <li
                    key={index}
                    className="text-sm p-1 hover:cursor-pointer"
                    onClick={(event: React.MouseEvent<Element, MouseEvent>) => handleRedirect(subcategory.path, event)}
                  >
                    <div className="flex gap-1 text-center text-xs">
                      <GoDotFill />{subcategory.name}
                    </div>
                    <hr />
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
