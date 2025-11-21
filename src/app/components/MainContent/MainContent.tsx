"use client";
import { useMobile } from "@/app/context/ResponsiveContext";
import { usePathname } from "next/navigation";
import React from "react";

const MainContent = ({ children }: { children: React.ReactNode }) => {
  const { isMobile } = useMobile();

  const pathname = usePathname();

  const isSelectCustomers = pathname === "/selectCustomer";
  return (
    <div
      className={`${
        isMobile ? (isSelectCustomers ? "mt-12" : "mt-12") : "mt-16"
      } sm:mt-12 transition-all duration-300 flex-1 overflow-auto no-scrollbar bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500`}
    >
      {children}
    </div>
  );
};

export default MainContent;
