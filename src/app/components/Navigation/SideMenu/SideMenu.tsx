"use client";
import React, { useState } from "react";
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
import { FaRegClock } from "react-icons/fa6";
import { PiDownloadSimpleBold } from "react-icons/pi";
import { ImStatsDots } from "react-icons/im";
import ButtonsIcons from "./components/ButtonsIcons";
import { useClient } from "@/app/context/ClientContext";
import { useAuth } from "@/app/context/AuthContext";

const SideMenu = ({ isOpen }: any) => {
  const { selectedClientId } = useClient();
  const { role } = useAuth();
  const icons = [
    {
      icon: <MdDashboard />,
      name: "Dashboard",
      path: "/dashboard",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      icon: <MdOutlineShoppingBag />,
      name: "Catalogue",
      path: "/catalogue",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      icon: <IoIosLaptop />,
      name: "Systems",
      allowedRoles: ["ADMINISTRADOR"],
      subCategories: [
        { name: "Users", path: "/system/users" },
        {
          name: "Searches Without Results",
          path: "/system/searches",
        },
        // { name: "Logs", path: "/system/logs" },
        // { name: "Parameters", path: "/system/parameters" },
        // { name: "Database Tables", path: "/system/tables" },
        // { name: "Scheduled Task", path: "/system/crons"},
      ],
    },
    {
      icon: <FaDatabase />,
      name: "Data",
      allowedRoles: ["ADMINISTRADOR"],
      subCategories: [
        { name: "Articles", path: "/data/articles" },
        {
          name: "Brands",
          path: "/data/brands",
        },
        // { name: "Families", path: "/data/families" },
        { name: "Items", path: "/data/items" },
        // { name: "Subitems", path: "/data/subitems"},
        // { name: "Files", path: "/data/files" },
        {
          name: "Applications of Articles",
          path: "/data/application-of-articles",
        },
        // { name: "Bank Accounts", path: "/data/bank-accounts" },
        // { name: "Bonifications", path: "/data/bonifications"},
        {
          name: "Payment Conditions",
          path: "/data/payment-conditions",
        },
        { name: "Stock", path: "/data/stock" },
        {
          name: "Branches",
          path: "/data/branches",
        },
        {
          name: "Transports",
          path: "/data/transports",
        },
        {
          name: "Sellers",
          path: "/data/sellers",
        },
      ],
    },
    {
      icon: <IoMegaphoneOutline />,
      name: "Marketing",
      allowedRoles: ["ADMINISTRADOR", "MARKETING"],
      subCategories: [
        {
          name: "Notifications",
          path: "/marketing/notifications",
        },
        // { name: "Publications of Notifications", path: "/marketing/publications-of-notifications" },
        {
          name: "Banners",
          path: "/marketing/banners",
        },
        {
          name: "Popups",
          path: "/marketing/popups",
          allowedRoles: ["ADMINISTRADOR"],
        },
        // { name: "Files", path: "/marketing/files"},
        {
          name: "FAQS",
          path: "/marketing/faqs",
        },
        {
          name: "Tags",
          path: "/marketing/tags",
        },
        // { name: "Articles", path: "/data/articles" },
        // { name: "Brands", path: "/data/brands"  },
        // { name: "Families", path: "/marketing/families"  },
        // { name: "Items", path: "/data/items" },
        // { name: "Subitems", path: "/marketing/subitems" },
      ],
    },
    {
      icon: <CgProfile />,
      name: "Select Customer",
      path: "/selectCustomer",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      icon: <BsCash />,
      name: "Current Accounts",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
      subCategories: [
        {
          name: "Document Status",
          path: "/accounts/status",
        },
        {
          name: "Payments",
          path: "/accounts/payments",
        },
        {
          name: "Vouchers",
          path: "/accounts/vouchers",
        },
      ],
    },
    {
      icon: <BsCash />,
      name: "Collections Summaries",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
      getSubCategories: (role: any) => {
        const baseSubCategory = [
          {
            name: "Collections Summaries",
            path: "/collections/summaries",
          },
        ];

        if (role === "ADMINISTRADOR") {
          return [
            ...baseSubCategory,
            {
              name: "Collections Unsummaries",
              path: "/collections/unsummaries",
            },
          ];
        }

        return baseSubCategory;
      },
    },
    {
      icon: <CgShoppingCart />,
      name: "Orders",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
      subCategories: [
        {
          name: "Pedidos",
          path: "/orders/orders",
        },
        {
          name: "Presupuestos",
          path: "/orders/budgets",
        },
      ],
    },
    {
      icon: <MdOutlineMessage />,
      name: "CRM",
      path: "/crm",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      icon: <FaHeart />,
      name: "Favourites",
      path: "/favourites",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    // { icon: <FaRegClock />, name: "Pendings", path: "/pendings", allowedRoles: ["ADMINISTRADOR"]  },
    {
      icon: <MdNotificationsNone />,
      name: "Notifications",
      path: "/notifications",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      icon: <PiDownloadSimpleBold />,
      name: "Downloads",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
      subCategories: [
        {
          name: "Lists Prices Downloads",
          path: "/downloads/prices-lists",
        },
        {
          name: "Bonifications Downloads",
          path: "/downloads/articles-bonuses",
        },
      ],
    },
    {
      icon: <MdOutlineInfo />,
      name: "Reclaims",
      path: "/reclaims",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      icon: <ImStatsDots />,
      name: "Statistics",
      path: "/statistics",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    }, //FALTA HACER STATISTICS
    {
      icon: <MdOutlineQuestionMark />,
      name: "FAQ",
      path: "/faqs",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      icon: <MdOutlineQuestionMark />,
      name: "Contact",
      path: "/contact",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    }, //FALTA HACER CONTACT
    {
      icon: <IoPersonOutline />,
      name: "My Profile",
      path: "/profile/my-profile",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
      getSubCategories: (role: any, selectedClientId: any) => {
        const allSubCategories = [
          {
            name: "My Profile",
            path: "/profile/my-profile",
          },
          {
            name: "Brand Margins",
            path: "/profile/brands-margin",
          },
          { name: "Item Margins", path: "/profile/items-margin" },
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
      name: "LogOut",
      path: "/logout",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
  ];
  const [openSubCategory, setOpenSubCategory] = useState<string | null>(null);

  const filteredIcons = React.useMemo(() => {
    return role
      ? icons
          .map((icon) => {
            const hasAllowedRole =
              !icon.allowedRoles || icon.allowedRoles.includes(role);
            const isMyProfile = icon.name === "My Profile";
            const shouldShow =
              hasAllowedRole &&
              (isMyProfile ||
                selectedClientId ||
                (icon.name !== "Favourites" && icon.name !== "Contact"));

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
  }, [role, selectedClientId]);

  return (
    <div
      className={`${
        isOpen ? "w-68 items-start px-8" : "w-20 items-center"
      } bg-header-color h-full py-4 flex flex-col justify-start gap-6 transition-all duration-300 overflow-y-scroll hide-scrollbar mt-20`}
    >
      {filteredIcons.map((icon: any, index: any) => (
        <ButtonsIcons
          key={index}
          icon={icon}
          isOpen={isOpen}
          openSubCategory={openSubCategory}
          setOpenSubCategory={setOpenSubCategory}
        />
      ))}
    </div>
  );
};

export default SideMenu;
