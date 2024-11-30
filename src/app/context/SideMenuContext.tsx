"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SideMenuContextProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const SideMenuContext = createContext<SideMenuContextProps | undefined>(undefined);

export const SideMenuProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SideMenuContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SideMenuContext.Provider>
  );
};

export const useSideMenu = () => {
  const context = useContext(SideMenuContext);
  if (context === undefined) {
    throw new Error('useSideMenu must be used within a SideMenuProvider');
  }
  return context;
};
