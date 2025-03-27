"use client";
import React from "react";

const MainContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={`mt-24 sm:mt-12 transition-all duration-300 flex-1 overflow-auto no-scrollbar`}>
      {children}
    </div>
  );
};

export default MainContent;
