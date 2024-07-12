"use client";
import { useSideMenu } from '@/app/context/SideMenuContext';
import React from 'react';

const MainContent = ({ children }: { children: React.ReactNode }) => {
  const { isOpen } = useSideMenu();
  return (
    <div className={`${isOpen ? "ml-80" : "ml-24"} mt-24 transition-all duration-300`}>
      {children}
    </div>
  );
};

export default MainContent;
