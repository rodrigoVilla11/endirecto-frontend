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

const SideMenu = () => {
  const { isOpen, setIsOpen, setOpenSubCategory } = useSideMenu();
  const { t } = useTranslation();
  const { selectedClientId, setSelectedClientId } = useClient();
  const { setIsAuthenticated, setRole, role } = useAuth();
  const router = useRouter();
  const { isMobile } = useMobile();

  const pathname = usePathname();
  
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
        // {
        //   name: t("branches"),
        //   path: "/data/branches",
        // },
        // {
        //   name: t("transports"),
        //   path: "/data/transports",
        // },
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
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
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
      icon: <BsCash />,
      name: t("collectionsSummaries"),
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
      subCategories: [
        {
          name: t("collectionsSummaries"),
          path: "/collections/summaries",
        },
        {
          name: t("collectionsUnsummaries"),
          path: "/collections/unsummaries",
        },
      ],
    },
    {
      icon: <CgShoppingCart />,
      name: t("orders"),
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
      subCategories: [
        {
          name: t("ordersName"),
          path: "/orders/orders",
        },
        selectedClientId && {
          name: t("shoppingCart"),
          path: "/shopping-cart",
        },
      ],
    },
    {
      icon: <MdOutlineMessage />,
      name: t("crm"),
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
      getSubCategories: (role: any, selectedClientId: any) => {
        const allSubCategories = [
          {
            name: t("myProfile"),
            path: "/profile/my-profile",
          },
          {
            name: t("brandMargins"),
            path: "/profile/brands-margin",
          },
          { name: t("itemMargins"), path: "/profile/items-margin" },
        ];

        if (role === "ADMINISTRADOR") {
          return allSubCategories;
        } else if (["OPERADOR", "MARKETING", "VENDEDOR"].includes(role)) {
          if (selectedClientId) {
            return allSubCategories;
          } else {
            return [allSubCategories[0]];
          }
        }
        return [];
      },
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

  const filteredIcons = React.useMemo(() => {
    return role
      ? icons
          .map((icon) => {
            const hasAllowedRole =
              !icon.allowedRoles || icon.allowedRoles.includes(role);
            const isMyProfile = icon.name === t("myProfile");
            const shouldShow =
              hasAllowedRole &&
              (isMyProfile ||
                selectedClientId ||
                (icon.name !== t("favourites") && icon.name !== t("contact")));

            if (icon.getSubCategories) {
              return {
                ...icon,
                subCategories: icon.getSubCategories(role, selectedClientId),
              };
            }

            return shouldShow ? icon : null;
          })
          .filter(Boolean)
      : icons;
  }, [role, selectedClientId, icons, t]);

  // Referencia al contenedor del menú para detectar clics fuera
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
        setOpenSubCategory(null)
      }
    };
  
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);
  

  return (
    <div
      ref={menuRef}
      className={`${
        isOpen
          ? `fixed inset-0 w-full h-auto z-50 ${
              isMobile ? "bg-zinc-900" : "bg-header-color"
            } px-8 sm:relative sm:inset-auto sm:w-68 sm:h-auto sm:z-auto`
          : "hidden sm:flex sm:w-20 sm:items-center sm:bg-header-color sm:opacity-100"
      } py-4 flex flex-col justify-start gap-6 transition-all duration-300 overflow-y-auto hide-scrollbar sm:mt-16 ${isSelectCustomers ? "mt-20" : "mt-28"} pt-4`}
    >
        {filteredIcons.map((icon: any, index: any) => (
          <ButtonsIcons
            key={index}
            icon={icon}
          />
        ))}
    </div>
  );
};

export default SideMenu;
