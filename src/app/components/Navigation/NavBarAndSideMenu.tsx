"use client";
import React from "react";
import NavBar from "./NavBar/NavBar";
import SideMenu from "./SideMenu/SideMenu";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useAuth } from "@/app/context/AuthContext";
import NavBarHome from "./NavBarHome/NavBarHome";
import { usePathname } from "next/navigation";

const NavBarAndSideMenu = () => {
  const { isOpen, setIsOpen } = useSideMenu();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  const showNavBarHome = pathname === "/" || pathname === "/login" || pathname === "/catalogues";

  return (
    <div className={`flex ${isOpen ? "side-menu-open" : "side-menu-closed"}`}>
      
      {showNavBarHome ? (
        <NavBarHome />
      ) : (
        isAuthenticated && (
          <>
            <NavBar setIsOpen={setIsOpen} isOpen={isOpen} />
            <SideMenu isOpen={isOpen} setIsOpen={setIsOpen} />
          </>
        )
      )}
    </div>
  );
};

export default NavBarAndSideMenu;
