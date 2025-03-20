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
    <div
      className={`bg-primary flex ${
        isMobile ? "flex-col gap-10" : ""
      } justify-around items-center text-white p-10 w-full`}
      id="contact"
    >
      <div
        className={`flex flex-col gap-2 justify-center ${
          isMobile ? "items-center" : "items-start"
        } text-sm`}
      >
        <h2 className="text-2xl text-center">{t("footer.title")}</h2>
        <button onClick={() => handleRedirect("/")}>{t("footer.home")}</button>
        <button onClick={() => handleScroll("brands")}>{t("footer.brands")}</button>
        <button onClick={() => handleScroll("tags")}>{t("footer.tags")}</button>
        <button onClick={() => handleScroll("articles")}>{t("footer.articles")}</button>
        <button onClick={() => handleScroll("contact")}>{t("footer.contact")}</button>
      </div>
      <div className="flex flex-col gap-2 justify-center items-start text-sm">
        <p className="flex gap-2">
          <IoMdPin />
          {t("footer.address")}
        </p>
        <p className="flex gap-2">
          <FaPhoneAlt />
          {t("footer.phone")}
        </p>
        <p className="flex gap-2">
          <MdAttachEmail />
          {t("footer.email")}
        </p>
        <p className="flex gap-2">
          <FaCalendarAlt />
          {t("footer.schedule")}
        </p>
      </div>
    </div>
  );
};

export default Footer;
