import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { BiSearchAlt } from "react-icons/bi";
import { GiUsaFlag } from "react-icons/gi";
import { IoMenu, IoClose } from "react-icons/io5";
import Search from "../../NavBar/components/Search";

const Buttons = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      if (window.innerWidth >= 640) setMenuOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    id: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);

    if (element) {
      const navbarHeight = document.querySelector("nav")?.clientHeight || 0;
      const rect = element.getBoundingClientRect();

      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setTimeout(() => {
        window.scrollBy(0, -navbarHeight);
      }, 100);
    }
    setMenuOpen(false);
  };

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
      setMenuOpen(false);
    }
  };

  const handleSearchToggle = () => {
    setSearchOpen(!isSearchOpen);
    if (isMenuOpen) setMenuOpen(false); // Cierra el menú si está abierto
  };

  return (
    <>
      {isMobile ? (
        <div className="flex items-center justify-between text-sm text-white gap-6">
          <button className="text-xl" onClick={handleSearchToggle}>
            <BiSearchAlt />
          </button>

          {isSearchOpen && (
            <div className="w-full flex justify-center sm:my-2 absolute top-16 p-4 right-0 sm:static bg-header-color">
              <Search />
            </div>
          )}

          <button onClick={() => setMenuOpen(!isMenuOpen)}>
            <IoMenu className="text-white text-2xl" />
          </button>

          {isMenuOpen && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
              <div className="absolute right-0 top-0 h-full w-3/4 bg-gray-900 p-6">
                <div className="flex justify-between items-center mb-8">
                  <GiUsaFlag className="text-xl" />
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="text-2xl text-white"
                  >
                    <IoClose />
                  </button>
                </div>

                <div className="flex flex-col gap-6 text-white">
                  <a href="/" onClick={(e) => handleRedirect("/")}>
                    Home
                  </a>
                  <a href="#brands" onClick={(e) => handleScroll(e, "brands")}>
                    Brands
                  </a>
                  <a href="#tags" onClick={(e) => handleScroll(e, "tags")}>
                    Tags
                  </a>
                  <a
                    href="#articles"
                    onClick={(e) => handleScroll(e, "articles")}
                  >
                    Articles
                  </a>
                  <a
                    href="#contact"
                    onClick={(e) => handleScroll(e, "contact")}
                  >
                    Contact
                  </a>

                  <div className="border-t pt-6 mt-6">
                    {isAuthenticated ? (
                      <button
                        onClick={() => handleRedirect("/dashboard")}
                        className="w-full text-left"
                      >
                        Dashboard
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRedirect("/login")}
                        className="w-full text-left"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm text-white gap-6">
          <a href="/" onClick={(e) => handleRedirect("/")}>
            Home
          </a>
          <a href="#brands" onClick={(e) => handleScroll(e, "brands")}>
            Brands
          </a>
          <a href="#tags" onClick={(e) => handleScroll(e, "tags")}>
            Tags
          </a>
          <a href="#articles" onClick={(e) => handleScroll(e, "articles")}>
            Articles
          </a>
          <a href="#contact" onClick={(e) => handleScroll(e, "contact")}>
            Contact
          </a>
          <button className="text-xl">
            <GiUsaFlag />
          </button>
          {isAuthenticated ? (
            <button onClick={() => handleRedirect("/dashboard")}>
              Dashboard
            </button>
          ) : (
            <button onClick={() => handleRedirect("/login")}>Sign In</button>
          )}
          <button className="text-xl">
            <BiSearchAlt />
          </button>
        </div>
      )}
    </>
  );
};

export default Buttons;
