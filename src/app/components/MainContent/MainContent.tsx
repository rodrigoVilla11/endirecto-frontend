"use client";
import { useMobile } from "@/app/context/ResponsiveContext";
import { usePathname } from "next/navigation";
import React from "react";

const MainContent = ({ children }: { children: React.ReactNode }) => {
  const { isMobile } = useMobile();
  const pathname = usePathname();

  const isSelectCustomers = pathname === "/selectCustomer";

  return (
    <main
      className={`
        flex-1 overflow-auto no-scrollbar transition-all duration-300
        ${isMobile ? "mt-12" : "mt-16"}
        bg-[#0B0B0B]
      `}
    >
      {/* Background decorativo opcional */}
      <div className="relative min-h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E10600]/5 via-transparent to-blue-500/5 pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </div>
    </main>
  );
};

export default MainContent;
