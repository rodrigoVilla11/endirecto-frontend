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
import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerInformationByCustomerIdQuery } from "@/redux/services/customersInformations";

const DashboardPage = () => {
  const { isOpen } = useSideMenu();
  const { selectedClientId } = useClient();

  const { role } = useAuth();
  const { data: countCustomersData } = useCountCustomersQuery({});
  const { data: totalDebt, error, isLoading } = useGetCustomerInformationByCustomerIdQuery({
    id: selectedClientId ?? undefined,
  });
  

  // Verificar si `data` es un cliente o un objeto resumen
  const isClient = totalDebt && "documents_balance" in totalDebt;
  const isSummary = totalDebt && "total_documents_balance" in totalDebt;

  // Definir valores dinámicos según el tipo de `data`
  // Primero, extraemos los valores sin formatear y los convertimos a número
  const rawDocumentsBalance = isClient
    ? parseFloat(totalDebt.documents_balance)
    : isSummary
    ? parseFloat(totalDebt.total_documents_balance)
    : 0;

  const rawDocumentsBalanceExpired = isClient
    ? parseFloat(totalDebt.documents_balance_expired)
    : isSummary
    ? parseFloat(totalDebt.total_documents_balance_expired)
    : 0;

  // Suma los valores numéricos directamente
  const finalSumAmount = rawDocumentsBalance + rawDocumentsBalanceExpired;

  // Ahora formatea el resultado final para mostrarlo
  const formattedFinalSumAmount = finalSumAmount.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });


  function formatPriceWithCurrency(price: number): string {
    const formattedNumber = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(price)
      .replace("ARS", "") // Elimina "ARS" del formato.
      .trim(); // Elimina espacios extra.
    return `${formattedNumber}`; // Agrega el símbolo "$" con espacio al principio.
  }

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
      subtitle: `${formatPriceWithCurrency(finalSumAmount)}`,
      text: `Expired: ${formatPriceWithCurrency(rawDocumentsBalance)}`,
      href: "/accounts/status",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
    // {
    //   logo: <TbClockExclamation />,
    //   title: "Pendings",
    //   subtitle: "$ 9.999.999",
    //   text: (
    //     <>
    //       Codes: 92
    //       <br />
    //       With Stock: $ 9.999.999
    //     </>
    //   ),
    //   href: "",
    //   allowedRoles: ["ADMINISTRADOR"],
    // },
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
    // {
    //   logo: <CgProfile />,
    //   title: "Customers Contacted",
    //   subtitle: "2 %",
    //   text: (
    //     <>
    //       Customers Contacted: 180
    //       <br />
    //       Total Customers: 9.999
    //     </>
    //   ),
    //   href: "/crm",
    //   allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    // },
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
    // {
    //   logo: <GoGraph />,
    //   title: "Days of WEB use Clients",
    //   subtitle: "1.95 %",
    //   href: "",
    //   allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    // },
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
    <div className="gap-4">
      <Header />
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

export default DashboardPage;
