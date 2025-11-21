"use client";
import React from "react";
import { IoMdPin } from "react-icons/io";
import { FaPhoneAlt, FaCalendarAlt } from "react-icons/fa";
import { MdAttachEmail } from "react-icons/md";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

const Footer = () => {
  const { isMobile } = useMobile();
  const { t } = useTranslation();
  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  const handleScroll = (id: string) => {
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
  };

  return (
    <footer
      className={`bg-gradient-to-br from-zinc-900 to-zinc-800 text-white w-full relative overflow-hidden`}
      id="contact"
    >
      {/* Elementos decorativos */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl"></div>
      </div>

      <div className={`container mx-auto px-4 py-16 relative z-10`}>
        <div className={`grid ${isMobile ? "grid-cols-1 gap-12" : "grid-cols-3 gap-8"}`}>
          {/* Columna 1: Logo y descripción */}
          <div className={`flex flex-col gap-6 ${isMobile ? "items-center text-center" : "items-start"}`}>
            <div className="bg-white rounded-2xl p-4 shadow-xl">
              <img src="/dma.png" alt="DMA Logo" className="h-16 object-contain" />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              {t("footer.description") || "Tu partner de confianza en soluciones industriales."}
            </p>
          </div>

          {/* Columna 2: Enlaces */}
          <div className={`flex flex-col gap-4 ${isMobile ? "items-center" : "items-start"}`}>
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              {t("footer.title") || "Enlaces Rápidos"}
            </h3>
            <button 
              onClick={() => handleRedirect("/")}
              className="text-gray-300 hover:text-white transition-colors hover:translate-x-2 transform duration-200"
            >
              → {t("footer.home")}
            </button>
            <button 
              onClick={() => handleScroll("brands")}
              className="text-gray-300 hover:text-white transition-colors hover:translate-x-2 transform duration-200"
            >
              → {t("footer.brands")}
            </button>
            <button 
              onClick={() => handleScroll("tags")}
              className="text-gray-300 hover:text-white transition-colors hover:translate-x-2 transform duration-200"
            >
              → {t("footer.tags")}
            </button>
            <button 
              onClick={() => handleScroll("articles")}
              className="text-gray-300 hover:text-white transition-colors hover:translate-x-2 transform duration-200"
            >
              → {t("footer.articles")}
            </button>
            <button 
              onClick={() => handleScroll("contact")}
              className="text-gray-300 hover:text-white transition-colors hover:translate-x-2 transform duration-200"
            >
              → {t("footer.contact")}
            </button>
          </div>

          {/* Columna 3: Contacto */}
          <div className={`flex flex-col gap-4 ${isMobile ? "items-center text-center" : "items-start"}`}>
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t("footer.contactTitle") || "Contacto"}
            </h3>
            <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group">
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <IoMdPin className="text-xl" />
              </div>
              <span className="text-sm">{t("footer.address")}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group">
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <FaPhoneAlt className="text-lg" />
              </div>
              <span className="text-sm">{t("footer.phone")}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group">
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <MdAttachEmail className="text-xl" />
              </div>
              <span className="text-sm">{t("footer.email")}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group">
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <FaCalendarAlt className="text-lg" />
              </div>
              <span className="text-sm">{t("footer.schedule")}</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 <span className="font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">DMA</span>. {t("footer.rights") || "Todos los derechos reservados."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;