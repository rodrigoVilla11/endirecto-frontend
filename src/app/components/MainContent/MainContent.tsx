"use client";
import { useSideMenu } from '@/app/context/SideMenuContext';
import React from 'react';

const MainContent = ({ children }: { children: React.ReactNode }) => {
  const { isOpen } = useSideMenu();
  const isLogin = false;
  return (
    <div className={`${isLogin && `${isOpen ? "ml-80" : "ml-24"}`} mt-20 transition-all duration-300`}>
      {children}
    </div>
  );
};

export default MainContent;
