"use client";
import React, { useState } from "react";
import NavBar from "./NavBar/NavBar";
import SideMenu from "./SideMenu/SideMenu";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useAuth } from "@/app/context/AuthContext";
import NavBarHome from "./NavBarHome/NavBarHome";

const NavBarAndSideMenu = () => {
  const { isOpen, setIsOpen } = useSideMenu();
  const { isAuthenticated } = useAuth();

  return (
    <div className={`flex ${isOpen ? "side-menu-open" : "side-menu-closed"}`}>
      {isAuthenticated ? (
        <>
          <NavBar setIsOpen={setIsOpen} isOpen={isOpen} />
          <SideMenu isOpen={isOpen} />
        </>
      ) : (
        <NavBarHome />
      )}
    </div>
  );
};

export default NavBarAndSideMenu;
