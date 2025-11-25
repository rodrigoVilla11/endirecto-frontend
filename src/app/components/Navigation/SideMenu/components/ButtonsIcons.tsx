"use client";
import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AiFillCaretDown } from "react-icons/ai";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useMobile } from "@/app/context/ResponsiveContext";

interface Icon {
  icon: React.ReactNode;
  name: string;
  path?: string;
  subCategories?: { name: string; path: string }[];
  onClick?: () => void;
}

interface ButtonsIconsProps {
  icon: Icon;
}

const ButtonsIcons: React.FC<ButtonsIconsProps> = ({ icon }) => {
  const { isOpen, setIsOpen, openSubCategory, setOpenSubCategory } =
    useSideMenu();

  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useMobile();

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleSubCategories = () => {
    setIsOpen(true);
    if (openSubCategory === icon.name) {
      setOpenSubCategory(null);
    } else {
      setOpenSubCategory(icon.name);
    }
  };

  // Redirige y cierra menú
  const handleRedirect = (path: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (path) {
      router.push(path);
    }
    setOpenSubCategory(null);
    setIsOpen(false);
  };

  // Clic principal
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();

    if (icon.onClick) {
      icon.onClick();
      return;
    }

    // ⚠️ Si ya está abierta, solo cerramos (NO reabrimos)
    if (openSubCategory === icon.name) {
      setOpenSubCategory(null);
      return;
    }

    // 👇 Solo se ejecuta si no está abierta
    if (icon.subCategories) {
      setIsOpen(true);
      setOpenSubCategory(icon.name);
    } else {
      handleRedirect(icon.path || "", event);
      if (isMobile) {
        setIsOpen(false);
      }
    }
  };

  const showSubCategories = openSubCategory === icon.name;

  // Verificar si este ítem o alguna de sus subcategorías está activa
  const isActive =
    icon.path === pathname ||
    (icon.subCategories &&
      icon.subCategories.some((sub) => sub.path === pathname));

  return (
    <div ref={containerRef} className="flex flex-col gap-1 text-white w-full">
      {/* Categoría principal */}
      <div
        className={`flex items-center gap-3 cursor-pointer pl-3 py-3 rounded-l-lg transition-all duration-200 hover:bg-white hover:text-black ${
          isActive
            ? "bg-red-500 text-black"
            : "text-white"
        } ${!isOpen && "justify-center"}`}
        onClick={handleClick}
      >
        <div className="text-2xl flex-shrink-0">{icon.icon}</div>
        {isOpen && (
          <>
            <div className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1">
              {icon.name}
            </div>
            {icon.subCategories && (
              <AiFillCaretDown
                className={`text-xs cursor-pointer transition-transform duration-300 flex-shrink-0 ${
                  showSubCategories ? "rotate-180" : ""
                }`}
              />
            )}
          </>
        )}
      </div>

      {/* Subcategorías */}
      {icon.subCategories && showSubCategories && isOpen && (
        <div className="ml-8 mt-1 space-y-1 transition-all duration-300 max-h-60 overflow-y-auto hide-scrollbar">
          {icon.subCategories.map((subcategory, index) => {
            const isSubActive = subcategory.path === pathname;
            return (
              <div
                key={index}
                className={`text-sm px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-zinc-800 ${
                  isSubActive ? "bg-gradient-to-r from-red-500 via-white to-blue-500 text-black" : "text-gray-400"
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleRedirect(subcategory.path, event);
                }}
              >
                <div className="text-xs">{subcategory.name}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ButtonsIcons;
