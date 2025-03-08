"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BiSearchAlt } from "react-icons/bi";
import i18n from "i18next";
import Search from "../../NavBar/components/Search";
import ReactCountryFlag from "react-country-flag";
import { IoMenu, IoClose } from "react-icons/io5";

const Buttons = () => {
  const router = useRouter();
  const { t } = useTranslation(); // Hook de traducción
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");

  // Sincronizamos el estado con el idioma actual de i18n al montar el componente
  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, []);

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

  // Función para alternar el idioma y cambiar la bandera
  const handleLanguageToggle = () => {
    const newLanguage = currentLanguage === "en" ? "es" : "en";
    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  console.log(currentLanguage);

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
              <div className="absolute right-0 top-0 h-full w-3/4 bg-header-color p-6">
                <div className="flex justify-between items-center mb-8">
                  {/* Botón de bandera con funcionalidad i18n */}
                  <button onClick={handleLanguageToggle} className="text-xl">
                    {currentLanguage === "en" ? (
                      <ReactCountryFlag
                        countryCode="US"
                        svg
                        style={{ width: "1em", height: "1em" }}
                        title="Estados Unidos"
                      />
                    ) : (
                      <ReactCountryFlag
                        countryCode="AR"
                        svg
                        style={{ width: "1em", height: "1em" }}
                        title="Argentina"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="text-2xl text-white"
                  >
                    <IoClose />
                  </button>
                </div>
                <div className="flex flex-col gap-6 text-white">
                  <a href="/" onClick={(e) => handleRedirect("/")}>
                    {t("home")}
                  </a>
                  <a href="#brands" onClick={(e) => handleScroll(e, "brands")}>
                    {t("brands")}
                  </a>
                  <a href="#tags" onClick={(e) => handleScroll(e, "tags")}>
                    {t("tags")}
                  </a>
                  <a
                    href="#articles"
                    onClick={(e) => handleScroll(e, "articles")}
                  >
                    {t("articles")}
                  </a>
                  <a
                    href="#contact"
                    onClick={(e) => handleScroll(e, "contact")}
                  >
                    {t("contact")}
                  </a>
                  <div className="border-t pt-6 mt-6">
                    {isAuthenticated ? (
                      <button
                        onClick={() => handleRedirect("/dashboard")}
                        className="w-full text-left"
                      >
                        {t("dashboard")}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRedirect("/login")}
                        className="w-full text-left"
                      >
                        {t("signIn")}
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
            {t("home")}
          </a>
          <a href="#brands" onClick={(e) => handleScroll(e, "brands")}>
            {t("brands")}
          </a>
          <a href="#tags" onClick={(e) => handleScroll(e, "tags")}>
            {t("tags")}
          </a>
          <a href="#articles" onClick={(e) => handleScroll(e, "articles")}>
            {t("articles")}
          </a>
          <a href="#contact" onClick={(e) => handleScroll(e, "contact")}>
            {t("contact")}
          </a>
          {/* Botón de bandera para versión desktop */}
          <button onClick={handleLanguageToggle} className="text-xl">
            {currentLanguage === "es" ? (
              <ReactCountryFlag
                countryCode="AR"
                svg
                style={{ width: "1em", height: "1em" }}
                title="Argentina"
              />
            ) : (
              <ReactCountryFlag
                countryCode="US"
                svg
                style={{ width: "1em", height: "1em" }}
                title="Estados Unidos"
              />
            )}
          </button>
          {isAuthenticated ? (
            <button onClick={() => handleRedirect("/dashboard")}>
              {t("dashboard")}
            </button>
          ) : (
            <button onClick={() => handleRedirect("/login")}>
              {t("signIn")}
            </button>
          )}
          <button className="text-xl" onClick={handleSearchToggle}>
            <BiSearchAlt />
          </button>
        </div>
      )}
    </>
  );
};

export default Buttons;
