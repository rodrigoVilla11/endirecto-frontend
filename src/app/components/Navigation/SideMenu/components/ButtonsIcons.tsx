"use client";
import React from "react";
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
  const { isMobile } = useMobile();

  // Alterna la visibilidad de las subcategorías y abre el sideMenu.
  const toggleSubCategories = () => {
    setIsOpen(true);
    if (openSubCategory === icon.name) {
      setOpenSubCategory(null);
    } else {
      setOpenSubCategory(icon.name);
    }
  };

  // Maneja la redirección y cierra el dropdown.
  const handleRedirect = (path: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (path) {
      setIsOpen(false)
      setOpenSubCategory(null);
      router.push(path);
    }
  };

  // Ejecuta onClick personalizado o alterna las subcategorías/redirige.
  const handleClick = (event: React.MouseEvent) => {
    if (icon.onClick) {
      event.stopPropagation();
      icon.onClick();
    } else if (icon.subCategories) {
      toggleSubCategories();
    } else {
      handleRedirect(icon.path || "", event);
      isMobile && setIsOpen(false)
    }
  };

  // Indica si las subcategorías están abiertas para este ítem.
  const showSubCategories = openSubCategory === icon.name;

  return (
    <div className="flex flex-col gap-2 text-white">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={handleClick}
      >
        <div className="text-left hover:cursor-pointer">{icon.icon}</div>
        {isOpen && (
          <div className="text-xs hover:cursor-pointer">{icon.name}</div>
        )}
        {/* Mostrar el caret solo si existen subcategorías y el sideMenu está abierto.
            Se rota el caret si las subcategorías están abiertas */}
        {icon.subCategories && isOpen && (
          <AiFillCaretDown
            className={`text-xs cursor-pointer transition-transform duration-300 ${
              showSubCategories ? "rotate-180" : ""
            }`}
          />
        )}
      </div>
      {icon.subCategories && showSubCategories && (
        <div className="bg-header-color rounded-md px-2 w-48 transition-all duration-300 max-h-60 overflow-y-auto">
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
  );
};

export default ButtonsIcons;
