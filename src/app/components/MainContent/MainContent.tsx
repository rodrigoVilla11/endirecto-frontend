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
        isMobile ? (isSelectCustomers ? "mt-20" : "mt-24") : "mt-12"
      } sm:mt-12 transition-all duration-300 flex-1 overflow-auto no-scrollbar`}
    >
      {children}
    </div>
  );
};

export default MainContent;
