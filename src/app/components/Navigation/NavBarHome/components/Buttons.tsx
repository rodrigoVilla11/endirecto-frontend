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
import { Home, Tag, FileText, Mail, LayoutDashboard, LogIn } from "lucide-react";

const Buttons = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");

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
    if (isMenuOpen) setMenuOpen(false);
  };

  const handleLanguageToggle = () => {
    const newLanguage = currentLanguage === "en" ? "es" : "en";
    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return (
    <>
      {isMobile ? (
        <div className="flex items-center justify-between text-sm text-white gap-6">
          <button 
            className="text-2xl hover:scale-110 transition-transform p-2 hover:bg-white/20 rounded-full" 
            onClick={handleSearchToggle}
          >
            <BiSearchAlt />
          </button>
          {isSearchOpen && (
            <div className="w-full flex justify-center absolute top-24 p-4 right-0 bg-white shadow-2xl rounded-b-3xl border-t-4 border-purple-500">
              <Search />
            </div>
          )}
          <button 
            onClick={() => setMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-white/20 rounded-full transition-all"
          >
            <IoMenu className="text-white text-3xl" />
          </button>
          
          {isMenuOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
              <div className="absolute right-0 top-0 h-full w-3/4 bg-gradient-to-br from-zinc-900 to-zinc-800 shadow-2xl">
                {/* Header del menú */}
                <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-6 flex justify-between items-center">
                  <button 
                    onClick={handleLanguageToggle} 
                    className="text-2xl hover:scale-110 transition-transform bg-white/20 p-2 rounded-full"
                  >
                    {currentLanguage === "en" ? (
                      <ReactCountryFlag
                        countryCode="US"
                        svg
                        style={{ width: "1.5em", height: "1.5em" }}
                        title="Estados Unidos"
                      />
                    ) : (
                      <ReactCountryFlag
                        countryCode="AR"
                        svg
                        style={{ width: "1.5em", height: "1.5em" }}
                        title="Argentina"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="text-3xl text-white hover:bg-white/20 p-2 rounded-full transition-all"
                  >
                    <IoClose />
                  </button>
                </div>

                {/* Links del menú */}
                <div className="flex flex-col gap-2 p-6 text-white">
                  <a 
                    href="/" 
                    onClick={(e) => handleRedirect("/")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-all font-semibold"
                  >
                    <Home className="w-5 h-5" />
                    {t("home")}
                  </a>
                  <a 
                    href="#brands" 
                    onClick={(e) => handleScroll(e, "brands")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-all font-semibold"
                  >
                    <Tag className="w-5 h-5" />
                    {t("brands")}
                  </a>
                  <a 
                    href="#tags" 
                    onClick={(e) => handleScroll(e, "tags")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-all font-semibold"
                  >
                    <Tag className="w-5 h-5" />
                    {t("tags")}
                  </a>
                  <a
                    href="#articles"
                    onClick={(e) => handleScroll(e, "articles")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-all font-semibold"
                  >
                    <FileText className="w-5 h-5" />
                    {t("articles")}
                  </a>
                  <a
                    href="#contact"
                    onClick={(e) => handleScroll(e, "contact")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-all font-semibold"
                  >
                    <Mail className="w-5 h-5" />
                    {t("contact")}
                  </a>
                  
                  <div className="border-t-2 border-zinc-700 pt-6 mt-6">
                    {isAuthenticated ? (
                      <button
                        onClick={() => handleRedirect("/dashboard")}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 transition-all font-bold shadow-lg"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        {t("dashboard")}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRedirect("/login")}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all font-bold shadow-lg"
                      >
                        <LogIn className="w-5 h-5" />
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
        <div className="flex items-center justify-between text-sm text-white gap-8 font-semibold">
          <a 
            href="/" 
            onClick={(e) => handleRedirect("/")}
            className="hover:bg-white/20 px-4 py-2 rounded-xl transition-all hover:scale-105"
          >
            {t("home")}
          </a>
          <a 
            href="#brands" 
            onClick={(e) => handleScroll(e, "brands")}
            className="hover:bg-white/20 px-4 py-2 rounded-xl transition-all hover:scale-105"
          >
            {t("brands")}
          </a>
          <a 
            href="#tags" 
            onClick={(e) => handleScroll(e, "tags")}
            className="hover:bg-white/20 px-4 py-2 rounded-xl transition-all hover:scale-105"
          >
            {t("tags")}
          </a>
          <a 
            href="#articles" 
            onClick={(e) => handleScroll(e, "articles")}
            className="hover:bg-white/20 px-4 py-2 rounded-xl transition-all hover:scale-105"
          >
            {t("articles")}
          </a>
          <a 
            href="#contact" 
            onClick={(e) => handleScroll(e, "contact")}
            className="hover:bg-white/20 px-4 py-2 rounded-xl transition-all hover:scale-105"
          >
            {t("contact")}
          </a>
          
          <button 
            onClick={handleLanguageToggle} 
            className="text-xl hover:scale-110 transition-transform bg-white/20 p-2 rounded-full"
          >
            {currentLanguage === "es" ? (
              <ReactCountryFlag
                countryCode="AR"
                svg
                style={{ width: "1.2em", height: "1.2em" }}
                title="Argentina"
              />
            ) : (
              <ReactCountryFlag
                countryCode="US"
                svg
                style={{ width: "1.2em", height: "1.2em" }}
                title="Estados Unidos"
              />
            )}
          </button>
          
          {isAuthenticated ? (
            <button 
              onClick={() => handleRedirect("/dashboard")}
              className="px-6 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-105 font-bold"
            >
              {t("dashboard")}
            </button>
          ) : (
            <button 
              onClick={() => handleRedirect("/login")}
              className="px-6 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-105 font-bold"
            >
              {t("signIn")}
            </button>
          )}
          
          <button 
            className="text-2xl hover:scale-110 transition-transform p-2 hover:bg-white/20 rounded-full" 
            onClick={handleSearchToggle}
          >
            <BiSearchAlt />
          </button>
        </div>
      )}
    </>
  );
};

export default Buttons;