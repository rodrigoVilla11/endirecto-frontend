import React from "react";
import { useLocation } from "react-router-dom";
import Search from "./components/Search";
import ButtonSideMenu from "./components/ButtonSideMenu";
import Logo from "./components/Logo";
import SliderLogos from "./components/SliderLogos";
import ButtonsIcons from "./components/ButtonsIcons";
import Profile from "./components/Profile";
import { usePathname } from "next/navigation";

const NavBar = ({ setIsOpen, isOpen }: any) => {
  const isMobile = window.innerWidth < 640;
  const pathname = usePathname();

  const isSelectCustomers = pathname === "/selectCustomer";

  return (
    <nav
      className={`w-full ${
        isMobile ? (isSelectCustomers ? "h-20" : "h-28") : "h-16"
      } ${
        isMobile ? "bg-zinc-900" : "bg-header-color"
      } fixed z-40 flex justify-between px-4`}
    >
      {isMobile ? (
        <div className="w-full flex items-start justify-center sm:justify-between gap-4 mt-4 sm:mt-0">
          <div className="flex items-center gap-4">
            <ButtonSideMenu setIsOpen={setIsOpen} isOpen={isOpen} />
            <ButtonsIcons isMobile={isMobile} />
            <Profile isMobile={isMobile} />
          </div>
          {isMobile && !isSelectCustomers && (
            <div className="w-full flex justify-center sm:my-2 absolute bottom-2 sm:static">
              <Search />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <Logo />
            <ButtonSideMenu setIsOpen={setIsOpen} isOpen={isOpen} />
            {!isSelectCustomers && <Search />}
          </div>
          <div className="flex items-center">
            <SliderLogos />
          </div>
          <div className="flex items-center gap-4">
            <ButtonsIcons isMobile={isMobile} />
            <Profile isMobile={isMobile} />
          </div>
        </>
      )}
    </nav>
  );
};

export default NavBar;
