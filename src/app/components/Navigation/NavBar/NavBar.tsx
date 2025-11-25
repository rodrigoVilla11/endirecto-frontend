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
    <nav className="w-full fixed z-40 bg-zinc-950">
      {/* Desktop */}
      {!isMobile ? (
        <div className="h-16 flex items-center justify-between px-4 gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <Logo />
            <ButtonSideMenu />
            {!isSelectCustomers && (
              <div className="w-96">
                <Search />
              </div>
            )}
          </div>

          {/* Center Section */}
          <div className="flex items-center flex-1 justify-center">
            <SliderLogos />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <ButtonsIcons isMobile={isMobile} />
            <Profile isMobile={isMobile} />
          </div>
        </div>
      ) : (
        /* Mobile */
        <div className="h-16 flex items-center justify-between px-3 gap-3">
          {/* Left: Menu Button */}
          <div className="flex-shrink-0">
            <ButtonSideMenu />
          </div>

          {/* Center: Search (only if not selectCustomers) */}
          {!isSelectCustomers && (
            <div className="flex-1 min-w-0 mx-2">
              <Search />
            </div>
          )}

          {/* Right: Icons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <ButtonsIcons isMobile={isMobile} />
            <Profile isMobile={isMobile} />
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;