"use client";
import React from "react";
import Header from "./components/Header";
import Card from "./components/Card";
import { MdOutlineShoppingBag, MdTextSnippet } from "react-icons/md";
import { TbClockExclamation } from "react-icons/tb";
import {
  FaInfo,
  FaShoppingBag,
  FaPowerOff,
  FaShoppingCart,
  FaPhone,
  FaFileDownload,
} from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { BsCash } from "react-icons/bs";
import { IoIosPaper } from "react-icons/io";
import { IoNotificationsOutline, IoCalculatorSharp } from "react-icons/io5";
import { GoGraph } from "react-icons/go";
import { ImStatsDots } from "react-icons/im";
import CardShortcuts from "./components/CardShortcuts";
import { useSideMenu } from "@/app/context/SideMenuContext";
import Link from "next/link";
import { useCountCustomersQuery } from "@/redux/services/customersApi";
import {
  useSumAmountsQuery,
  useSumExpiredAmountsQuery,
} from "@/redux/services/documentsApi";
import { useAuth } from "@/app/context/AuthContext";

const DashboardSeller = () => {
  const { isOpen } = useSideMenu();

  const { role, userData } = useAuth();
  const { data: countCustomersData } = useCountCustomersQuery(null);
  const { data: sumExpiredAmountsData } = useSumExpiredAmountsQuery(null);
  const { data: sumAmountsData } = useSumAmountsQuery(null);
  const formatedSumAmount = sumAmountsData?.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatedExpiredSumAmount = sumExpiredAmountsData?.toLocaleString(
    "es-ES",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

  const itemsCard = [
    {
      logo: <MdOutlineShoppingBag />,
      title: "Catalogue",
      text: "Access our catalog of articles",
      href: "/catalogue",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      logo: <CgProfile />,
      title: "Select Customer",
      subtitle: countCustomersData,
      href: "/selectCustomer",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      logo: <MdTextSnippet />,
      title: "Status Account",
      subtitle: `$ ${formatedSumAmount}`,
      text: `Expired: $ ${formatedExpiredSumAmount}`,
      href: "/accounts/status",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      logo: <TbClockExclamation />,
      title: "Pendings",
      subtitle: "$ 9.999.999",
      text: (
        <>
          Codes: 92
          <br />
          With Stock: $ 9.999.999
        </>
      ),
      href: "",
      allowedRoles: ["ADMINISTRADOR"],
    },
    {
      logo: <BsCash />,
      title: "Interannual Sell",
      subtitle: "0 %",
      text: (
        <>
          Current Month: $ 0
          <br />
          Last Year Month: $ 0
        </>
      ),
      href: "",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <BsCash />,
      title: "Monthly Sell",
      subtitle: "0 %",
      text: (
        <>
          Current Month: $ 0
          <br />
          Last Year Month: $ 0
        </>
      ),
      href: "",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <FaInfo />,
      title: "Pending Reclaims",
      subtitle: "0",
      text: "Total Reclaims: 0",
      href: "/pendings",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      logo: <CgProfile />,
      title: "Customers Contacted",
      subtitle: "2 %",
      text: (
        <>
          Customers Contacted: 180
          <br />
          Total Customers: 9.999
        </>
      ),
      href: "/crm",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <IoIosPaper />,
      title: "Monthly Orders",
      subtitle: "$ 9.999.999",
      text: "Quantity of Orders: 80",
      href: "/orders/orders",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <IoIosPaper />,
      title: "Monthly Invoices ",
      subtitle: "$ 999.999.999",
      text: "Number of Invoices: 350",
      href: "/accounts/vouchers",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <IoNotificationsOutline />,
      title: "Notifications",
      subtitle: "0",
      text: "Without reading: 0",
      href: "/notifications",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      logo: <GoGraph />,
      title: "Days of WEB use Clients",
      subtitle: "1.95 %",
      href: "",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
  ];
  const itemsShortcuts = [
    {
      logo: <IoIosPaper />,
      title: "Documents",
      href: "/accounts/vouchers",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      logo: <BsCash />,
      title: "Collections",
      href: "/accounts/payments",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      logo: <BsCash />,
      title: "Collections Summaries",
      href: "/collections/summaries",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      logo: <BsCash />,
      title: "Collections Unsummaries",
      href: "/collections/unsummaries",
      allowedRoles: ["ADMINISTRADOR"],
    },
    {
      logo: <IoCalculatorSharp />,
      title: "Orders",
      href: "/orders/orders",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      logo: <IoCalculatorSharp />,
      title: "Budget",
      href: "/orders/budget",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      logo: <FaShoppingCart />,
      title: "Shopping Cart",
      href: "/shopping-cart",
      allowedRoles: ["CUSTOMER"],
    },
    {
      logo: <FaFileDownload />,
      title: "Download Price List",
      href: "/downloads/prices-lists",
      allowedRoles: ["CUSTOMER"],
    },
    {
      logo: <FaPhone />,
      title: "Contact",
      href: "/contact",
      allowedRoles: ["CUSTOMER"],
    },
    {
      logo: <ImStatsDots />,
      title: "Statistic",
      href: "/stats",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <CgProfile />,
      title: "My Profile",
      href: "/profile/my-profile",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    {
      logo: <BsCash />,
      title: "Brand Margins",
      href: "/profile/brands-margin",
      allowedRoles: ["CUSTOMER"],
    },
    {
      logo: <BsCash />,
      title: "Item Margins",
      href: "/profile/items-margin",
      allowedRoles: ["CUSTOMER"],
    },
    {
      logo: <FaPowerOff />,
      title: "Logout",
      href: "",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
  ];

  const filteredItemsCard = role
    ? itemsCard.filter(
        (icon) => !icon.allowedRoles || icon.allowedRoles.includes(role)
      )
    : itemsCard;

  const filteredItemsShortcuts = role
    ? itemsShortcuts.filter(
        (icon) => !icon.allowedRoles || icon.allowedRoles.includes(role)
      )
    : itemsCard;
    
  return (
    <div className="gap-4 bg-black">
      <div className="mt-12 sm:mt-8 text-white mx-2 sm:mx-5 p-4 sm:p-10">
        Hello {userData?.username} 
      </div>
      <div className="overflow-x-auto h-auto">
        <div
          className={`flex flex-wrap justify-evenly gap-4 p-4 ${
            isOpen ? "min-w-[250px]" : "min-w-[200px]"
          }`}
        >
          {filteredItemsCard.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="transform transition-transform duration-300 hover:scale-105"
            >
              <Card
                title={item.title}
                logo={item.logo}
                subtitle={item.subtitle}
                text={item.text}
                className="shadow-md hover:shadow-lg rounded-md border border-gray-200 w-[calc(50%-1rem)]" // Ocupa el 50% del ancho disponible
              />
            </Link>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto h-auto">
        <div
          className={`flex flex-wrap justify-evenly gap-4 p-4 ${
            isOpen ? "min-w-[250px]" : "min-w-[220px]"
          }`}
        >
          {filteredItemsShortcuts.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="transform transition-transform duration-300 hover:scale-105"
            >
              <CardShortcuts
                title={item.title}
                logo={item.logo}
                className="shadow-md hover:shadow-lg rounded-md border border-gray-200 w-[calc(50%-1rem)]" // Ocupa el 50% del ancho disponible
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSeller;
