"use client";
import React from "react";

const MainContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={`mt-16 transition-all duration-300 flex-1 overflow-y-auto`}>
      {children}
    </div>
  );
};

export default MainContent;
