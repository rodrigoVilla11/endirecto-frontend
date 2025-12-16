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
    if (path) router.push(path);
  };

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const navbarHeight = document.querySelector("nav")?.clientHeight || 0;
    element.scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(() => {
      window.scrollBy(0, -navbarHeight);
    }, 100);
  };

  return (
    <footer
      id="contact"
      className="w-full relative overflow-hidden bg-[#0B0B0B] text-white"
    >
      {/* Glow rojo sutil */}
      <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-[#E10600] opacity-20 rounded-full blur-3xl" />
      <div className="absolute -bottom-48 -left-48 w-[560px] h-[560px] bg-white opacity-5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div
          className={`grid ${
            isMobile ? "grid-cols-1 gap-12" : "grid-cols-3 gap-8"
          }`}
        >
          {/* Col 1 */}
          <div
            className={`flex flex-col gap-6 ${
              isMobile ? "items-center text-center" : "items-start"
            }`}
          >
            <div className="rounded-2xl p-4 bg-white/5 border border-white/10 shadow-xl backdrop-blur">
              <img
                src="/endirecto.png"
                alt="EN DIRECTO Logo"
                className="h-40 object-contain"
              />
            </div>

            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              {t("footer.description") ||
                "Tu partner de confianza en soluciones industriales."}
            </p>

            {/* Línea/acento */}
            <div className="h-1 w-16 rounded-full bg-[#E10600]" />
          </div>

          {/* Col 2 */}
          <div
            className={`flex flex-col gap-4 ${
              isMobile ? "items-center" : "items-start"
            }`}
          >
            <h3 className="text-xl font-extrabold tracking-tight">
              <span className="text-white">
                {t("footer.title") || "Enlaces Rápidos"}
              </span>
              <span className="text-[#E10600]">.</span>
            </h3>

            {[
              { label: t("footer.home"), onClick: () => handleRedirect("/") },
              { label: t("footer.brands"), onClick: () => handleScroll("brands") },
              { label: t("footer.tags"), onClick: () => handleScroll("tags") },
              { label: t("footer.articles"), onClick: () => handleScroll("articles") },
              { label: t("footer.contact"), onClick: () => handleScroll("contact") },
            ].map((l, i) => (
              <button
                key={i}
                onClick={l.onClick}
                className="text-white/70 hover:text-white transition-colors duration-200 group"
              >
                <span className="text-[#E10600] group-hover:translate-x-1 inline-block transition-transform duration-200">
                  →
                </span>{" "}
                {l.label}
              </button>
            ))}
          </div>

          {/* Col 3 */}
          <div
            className={`flex flex-col gap-4 ${
              isMobile ? "items-center text-center" : "items-start"
            }`}
          >
            <h3 className="text-xl font-extrabold tracking-tight">
              <span className="text-white">
                {t("footer.contactTitle") || "Contacto"}
              </span>
              <span className="text-[#E10600]">.</span>
            </h3>

            {[
              { icon: <IoMdPin className="text-xl" />, text: t("footer.address") },
              { icon: <FaPhoneAlt className="text-lg" />, text: t("footer.phone") },
              { icon: <MdAttachEmail className="text-xl" />, text: t("footer.email") },
              { icon: <FaCalendarAlt className="text-lg" />, text: t("footer.schedule") },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group"
              >
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-[#E10600]/40 group-hover:bg-[#E10600]/10 transition-colors">
                  <span className="text-[#E10600]">{item.icon}</span>
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-white/60 text-sm">
            © 2025{" "}
            <span className="font-extrabold text-white">
              EN DIRECTO<span className="text-[#E10600]">.</span>
            </span>{" "}
            {t("footer.rights") || "Todos los derechos reservados."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
