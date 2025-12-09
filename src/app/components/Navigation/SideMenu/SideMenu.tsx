"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  MdDashboard,
  MdOutlineShoppingBag,
  MdOutlineMessage,
  MdNotificationsNone,
  MdOutlineInfo,
  MdOutlineQuestionMark,
} from "react-icons/md";
import { FaDatabase, FaHeart, FaPowerOff } from "react-icons/fa";
import { BsCash } from "react-icons/bs";
import { IoIosLaptop } from "react-icons/io";
import { IoMegaphoneOutline, IoPersonOutline } from "react-icons/io5";
import { CgProfile, CgShoppingCart } from "react-icons/cg";
import { PiDownloadSimpleBold } from "react-icons/pi";
import { ImStatsDots } from "react-icons/im";
import ButtonsIcons from "./components/ButtonsIcons";
import { useClient } from "@/app/context/ClientContext";
import { useAuth } from "@/app/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { LucideMessageSquareShare } from "lucide-react";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useTranslation } from "react-i18next";
import { FaRegNoteSticky } from "react-icons/fa6";
import { RiBankFill } from "react-icons/ri";

const SideMenu = () => {
  const { isOpen, setIsOpen, setOpenSubCategory } = useSideMenu();
  const { t } = useTranslation();
  const { selectedClientId, setSelectedClientId } = useClient();
  const { setIsAuthenticated, setRole, role } = useAuth();
  const router = useRouter();
  const { isMobile } = useMobile();

  const pathname = usePathname();
  const { userData } = useAuth();

  const isSelectCustomers = pathname === "/selectCustomer";

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsOpen(false);
    router.push("/login");
    setIsAuthenticated(false);
    setSelectedClientId("");
    setRole(null);
  };

  const icons = [
    {
      icon: <MdDashboard />,
      name: t("dashboard"),
      path:
        role === "VENDEDOR" && selectedClientId
          ? "/orders/orderSeller"
          : "/dashboard",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      icon: <MdOutlineShoppingBag />,
      name: t("catalogue"),
      path: "/catalogue",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      icon: <IoIosLaptop />,
      name: t("systems"),
      allowedRoles: ["ADMINISTRADOR"],
      subCategories: [
        { name: t("users"), path: "/system/users" },
        {
          name: t("searchesWithoutResults"),
          path: "/system/searches",
        },
        { name: t("reclaims-types"), path: "/system/reclaims-types" },
      ],
    },
    {
      icon: <FaDatabase />,
      name: t("data"),
      allowedRoles: ["ADMINISTRADOR"],
      subCategories: [
        { name: t("articles"), path: "/data/articles" },
        {
          name: t("brands"),
          path: "/data/brands",
        },
        { name: t("items"), path: "/data/items" },
        {
          name: t("applicationsOfArticles"),
          path: "/data/application-of-articles",
        },
        {
          name: t("articlesEquivalences"),
          path: "/data/articles-equivalences",
        },
        {
          name: t("articlesTechnicalDetails"),
          path: "/data/articles-technical-details",
        },
        {
          name: t("paymentConditions"),
          path: "/data/payment-conditions",
        },
        { name: t("stock"), path: "/data/stock" },
        {
          name: t("sellers"),
          path: "/data/sellers",
        },
        { name: t("technicalDetails"), path: "/data/technical-details" },
      ],
    },
    {
      icon: <IoMegaphoneOutline />,
      name: t("marketing"),
      allowedRoles: ["ADMINISTRADOR", "MARKETING"],
      subCategories: [
        {
          name: t("notifications"),
          path: "/marketing/notifications",
        },
        {
          name: t("publicate-notifications"),
          path: "/marketing/publicate-notifications",
        },
        {
          name: t("banners"),
          path: "/marketing/banners",
        },
        {
          name: t("popups"),
          path: "/marketing/popups",
          allowedRoles: ["ADMINISTRADOR"],
        },
        {
          name: t("faqs"),
          path: "/marketing/faqs",
        },
        {
          name: t("tags"),
          path: "/marketing/tags",
        },
        {
          name: t("headers"),
          path: "/marketing/headers",
        },
      ],
    },
    {
      icon: <CgProfile />,
      name: t("selectCustomer"),
      path: "/selectCustomer",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      icon: <BsCash />,
      name: t("currentAccounts"),
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "VENDEDOR"],
      subCategories: [
        {
          name: t("documentStatus"),
          path: "/accounts/status",
        },
        {
          name: t("payments"),
          path: "/accounts/payments",
        },
        {
          name: t("vouchers"),
          path: "/accounts/vouchers",
        },
      ],
    },
    {
      icon: <RiBankFill />,
      name: t("finance"),
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "VENDEDOR"],
      subCategories: [
        role === "ADMINISTRADOR" && {
          name: t("settings"),
          path: "/finance/settings",
        },
        {
          name: t("Calculadora de Cheques"),
          path: "/finance/checkCalculator",
        },
        {
          name: t("Calculadora de Plan"),
          path: "/finance/planCalculator",
        },
      ],
    },
    {
      icon: <FaRegNoteSticky />,
      name: t("collectionsSummaries"),
      allowedRoles: ["ADMINISTRADOR"],
      path: "/collections/summaries",
    },
    {
      icon: <CgShoppingCart />,
      name: t("orders"),
      path: "/orders/orders",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      icon: <MdOutlineMessage />,
      name: t("crm.title"),
      path: "/crm",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      icon: <FaHeart />,
      name: t("favourites"),
      path: "/favourites",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      icon: <MdNotificationsNone />,
      name: t("notifications"),
      path: "/notifications",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      icon: <PiDownloadSimpleBold />,
      name: t("downloads"),
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
      subCategories: [
        {
          name: t("listsPricesDownloads"),
          path: "/downloads/prices-lists",
        },
        {
          name: t("bonificationsDownloads"),
          path: "/downloads/articles-bonuses",
        },
      ],
    },
    {
      icon: <MdOutlineInfo />,
      name: t("reclaims"),
      path: "/reclaims",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      icon: <ImStatsDots />,
      name: t("statistics"),
      path: "/statistics",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      icon: <MdOutlineQuestionMark />,
      name: t("faq"),
      path: "/faqs",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      icon: <LucideMessageSquareShare />,
      name: t("contact"),
      path: "/contact",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      icon: <IoPersonOutline />,
      name: t("myProfile"),
      path: "/profile/my-profile",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      icon: <FaPowerOff />,
      name: t("logOut"),
      onClick: handleLogout,
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
  ];

  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const navBtn = document.getElementById("navbar-button");
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !(navBtn && navBtn.contains(event.target as Node))
      ) {
        setIsOpen(false);
        setOpenSubCategory(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const filteredIcons = icons.filter((icon: any) => {
    // Si no tiene allowedRoles, lo mostramos siempre
    if (!icon.allowedRoles || !icon.allowedRoles.length) return true;
    // Si todavía no tenemos role cargado, no mostramos nada de este tipo
    if (!role) return false;
    // Solo si el role actual está permitido
    return icon.allowedRoles.includes(role);
  });

  return (
    <div
      ref={menuRef}
      className={`${
        isOpen
          ? `fixed inset-0 w-full h-full z-50 bg-zinc-950 pl-4 sm:relative sm:inset-auto sm:w-72 sm:h-auto sm:z-auto sm:bg-zinc-950`
          : "hidden sm:flex sm:w-16 sm:items-center sm:bg-zinc-950 sm:opacity-100"
      } py-3 flex flex-col justify-start gap-2 transition-all duration-300 overflow-y-auto hide-scrollbar sm:mt-16 ${
        isSelectCustomers ? "mt-16" : "mt-16"
      } pt-2`}
    >
      {filteredIcons.map((icon: any, index: any) => (
        <ButtonsIcons key={index} icon={icon} />
      ))}
    </div>
  );
};

export default SideMenu;
