"use client";
import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  const {
    isOpen,
    setIsOpen,
    openSubCategory,
    setOpenSubCategory,
  } = useSideMenu();

  const router = useRouter();
  const { isMobile } = useMobile();

  const containerRef = useRef<HTMLDivElement>(null);

  // Cierre al hacer clic fuera
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       containerRef.current &&
  //       !containerRef.current.contains(event.target as Node)
  //     ) {
  //       setOpenSubCategory(null);
  //     }
  //   };
  
  //   document.addEventListener("click", handleClickOutside); // 👈 CAMBIADO a "click"
  //   return () => {
  //     document.removeEventListener("click", handleClickOutside);
  //   };
  // }, [setOpenSubCategory]);
  

  // Alterna visibilidad de subcategorías
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

  return (
    <div ref={containerRef} className="flex flex-col gap-2 text-white">
      {/* Categoría principal */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={handleClick}>
        <div className="text-left hover:cursor-pointer">{icon.icon}</div>
        {isOpen && <div className="text-xs hover:cursor-pointer">{icon.name}</div>}

        {icon.subCategories && isOpen && (
          <AiFillCaretDown
            className={`text-xs cursor-pointer transition-transform duration-300 ${
              showSubCategories ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {/* Subcategorías */}
      {icon.subCategories && showSubCategories && (
        <div className="rounded-md px-1 w-48 transition-all duration-300 max-h-60 overflow-y-auto hide-scrollbar">
          <ul>
            {icon.subCategories.map((subcategory, index) => (
              <li
                key={index}
                className="text-sm p-1 hover:cursor-pointer text-left"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRedirect(subcategory.path, event);
                }}
              >
                <div className="flex gap-1 text-xs">{subcategory.name}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ButtonsIcons;
