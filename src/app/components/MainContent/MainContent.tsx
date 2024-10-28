"use client";
import React from "react";

const MainContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={`h-full mt-16 transition-all duration-300 flex-1 overflow-auto no-scrollbar`}>
      {children}
    </div>
  );
};

export default MainContent;
