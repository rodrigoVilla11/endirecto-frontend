"use client";
import React from "react";
import Search from "./components/Search";
import ButtonSideMenu from "./components/ButtonSideMenu";
import Logo from "./components/Logo";
import SliderLogos from "./components/SliderLogos";
import ButtonsIcons from "./components/ButtonsIcons";
import Profile from "./components/Profile";
import { usePathname } from "next/navigation";
import { useMobile } from "@/app/context/ResponsiveContext";

const NavBar = () => {
  const { isMobile } = useMobile();
  const pathname = usePathname();

  const isSelectCustomers = pathname === "/selectCustomer";

  return (
    <nav className="w-full fixed z-40 bg-[#0B0B0B]/90 backdrop-blur-xl border-b border-white/10">
      {/* Desktop */}
      {!isMobile ? (
        <div className="h-16 px-4">
          <div className="h-full mx-auto flex items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-4 min-w-[360px]">
              <Logo />
              <ButtonSideMenu />
              {!isSelectCustomers && (
                <div className="w-96">
                  <Search />
                </div>
              )}
            </div>

            {/* Center */}
            <div className="flex items-center flex-1 justify-center min-w-0">
              <SliderLogos />
            </div>

            {/* Right */}
            <div className="flex items-center gap-4 min-w-[240px] justify-end">
              <ButtonsIcons isMobile={isMobile} />
              <Profile isMobile={isMobile} />
            </div>
          </div>
        </div>
      ) : (
        /* Mobile */
        <div className="h-16 px-3">
          <div className="h-full max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Left */}
            <div className="flex-shrink-0">
              <ButtonSideMenu />
            </div>

            {/* Center */}
            {!isSelectCustomers && (
              <div className="flex-1 min-w-0 mx-2">
                <Search />
              </div>
            )}

            {/* Right */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <ButtonsIcons isMobile={isMobile} />
              <Profile isMobile={isMobile} />
            </div>
          </div>
        </div>
      )}

      {/* Accent line brand */}
      <div className="h-[2px] w-full bg-[#E10600]/80" />
    </nav>
  );
};

export default NavBar;
