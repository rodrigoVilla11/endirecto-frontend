"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface SideMenuContextProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  openSubCategory: string | null;
  setOpenSubCategory: (name: string | null) => void;
}

const SideMenuContext = createContext<SideMenuContextProps | undefined>(
  undefined
);

export const SideMenuProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubCategory, setOpenSubCategory] = useState<string | null>(null); // 👉 agregado
  useEffect(() => {
    console.log("🎯 SideMenuContext initialized");
  }, []);

  useEffect(() => {
    console.log("🔁 openSubCategory changed:", openSubCategory);
  }, [openSubCategory]);

  return (
    <SideMenuContext.Provider
      value={{ isOpen, setIsOpen, openSubCategory, setOpenSubCategory }}
    >
      {children}
    </SideMenuContext.Provider>
  );
};

export const useSideMenu = () => {
  const context = useContext(SideMenuContext);
  if (context === undefined) {
    throw new Error("useSideMenu must be used within a SideMenuProvider");
  }
  return context;
};
