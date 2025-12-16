import React from "react";
import Logo from "./components/Logo";
import Buttons from "./components/Buttons";

const NavBarHome = () => {
  return (
    <nav
      className="
      w-full h-24 sm:h-20
      bg-[#0B0B0B]
      fixed top-0 z-50
      flex justify-between items-center
      px-6 sm:px-10
      shadow-xl
      border-b-4 border-[#E10600]
    "
    >
      <Logo />
      <Buttons />
    </nav>
  );
};

export default NavBarHome;
