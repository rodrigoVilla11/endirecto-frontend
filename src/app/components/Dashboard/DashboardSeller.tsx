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
import { useGetBalancesSummaryQuery, useGetCustomerInformationByCustomerIdQuery } from "@/redux/services/customersInformations";
import { useClient } from "@/app/context/ClientContext";
import { useTranslation } from "react-i18next";

const DashboardSeller = () => {
  const { t } = useTranslation();
  const { isOpen } = useSideMenu();
  const { selectedClientId } = useClient();
  const { role, userData } = useAuth();

  const { data: countCustomersData } = useCountCustomersQuery({
    seller_id: userData?.seller_id,
  });
  const { data, error, isLoading } = useGetCustomerInformationByCustomerIdQuery({
    id: selectedClientId ?? undefined,
  });


  const queryParams =
    selectedClientId && selectedClientId !== ""
      ? { customerId: selectedClientId }
      : userData?.role === "VENDEDOR"
      ? { sellerId: userData.seller_id }
      : {};

  const { data: totalDebt } = useGetBalancesSummaryQuery(queryParams);

  const formatedSumAmount = totalDebt?.documents_balance?.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatedExpiredSumAmount = totalDebt?.documents_balance_expired?.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

    // ------------------ Definición de Items para Cards ------------------
    interface CardItem {
      logo: React.ReactNode;
      title: any;
      subtitle?: any;
      text?: any | undefined;
      href: string;
      allowedRoles: string[];
      color?: string; // propiedad opcional
      className?: string;
    }

  const itemsCard: CardItem[] = [
    {
      logo: <MdOutlineShoppingBag />,
      title: t("catalogue"),
      text: t("accessCatalog"),
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
      title: t("selectCustomer"),
      subtitle: countCustomersData,
      href: "/selectCustomer",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      logo: <MdTextSnippet />,
      title: t("statusAccount"),
      subtitle: `$ ${formatedSumAmount}`,
      text: t("expiredPrice", { amount: formatedExpiredSumAmount }),
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
      title: t("pendings"),
      subtitle: "$ 9.999.999",
      text: (
        <>
          {t("codes")}: 92
          <br />
          {t("withStock")}: $ 9.999.999
        </>
      ),
      href: "",
      allowedRoles: ["ADMINISTRADOR"],
    },
    {
      logo: <BsCash />,
      title: t("interannualSell"),
      subtitle: "0 %",
      text: (
        <>
          {t("currentMonth")}: $ 0
          <br />
          {t("lastYearMonth")}: $ 0
        </>
      ),
      href: "",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <BsCash />,
      title: t("monthlySell"),
      subtitle: "0 %",
      text: (
        <>
          {t("currentMonth")}: $ 0
          <br />
          {t("lastYearMonth")}: $ 0
        </>
      ),
      href: "",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <FaInfo />,
      title: t("pendingReclaims"),
      subtitle: "0",
      text: t("totalReclaims", { count: 0 }),
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
      title: t("customersContacted"),
      subtitle: "2 %",
      text: (
        <>
          {t("customersContacted")}: 180
          <br />
          {t("totalCustomers")}: 9.999
        </>
      ),
      href: "/crm",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <IoIosPaper />,
      title: t("monthlyOrders"),
      subtitle: "$ 9.999.999",
      text: t("quantityOrders", { quantity: 80 }),
      href: "/orders/orders",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <IoIosPaper />,
      title: t("monthlyInvoices"),
      subtitle: "$ 999.999.999",
      text: t("numberInvoices", { count: 350 }),
      href: "/accounts/vouchers",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <IoNotificationsOutline />,
      title: t("notifications"),
      subtitle: "0",
      text: t("withoutReading", { count: 0 }),
      href: "/notifications",
      allowedRoles: [
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ],
    },
  ];

  const itemsShortcuts = [
    {
      logo: <IoIosPaper />,
      title: t("documents"),
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
      title: t("collections"),
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
      title: t("collectionsSummaries"),
      href: "/collections/summaries",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      logo: <BsCash />,
      title: t("collectionsUnsummaries"),
      href: "/collections/unsummaries",
      allowedRoles: ["ADMINISTRADOR"],
    },
    {
      logo: <IoCalculatorSharp />,
      title: t("orders"),
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
      title: t("budget"),
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
      title: t("shoppingCart"),
      href: "/shopping-cart",
      allowedRoles: ["CUSTOMER"],
    },
    {
      logo: <FaFileDownload />,
      title: t("downloadPriceList"),
      href: "/downloads/prices-lists",
      allowedRoles: ["CUSTOMER"],
    },
    {
      logo: <FaPhone />,
      title: t("contact"),
      href: "/contact",
      allowedRoles: ["CUSTOMER"],
    },
    {
      logo: <ImStatsDots />,
      title: t("statistic"),
      href: "/stats",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <CgProfile />,
      title: t("myProfile"),
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
      title: t("brandMargins"),
      href: "/profile/brands-margin",
      allowedRoles: ["CUSTOMER"],
    },
    {
      logo: <BsCash />,
      title: t("itemMargins"),
      href: "/profile/items-margin",
      allowedRoles: ["CUSTOMER"],
    },
    {
      logo: <FaPowerOff />,
      title: t("logout"),
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
      <div className="mt-2 sm:mt-8 text-white mx-2 sm:mx-5 p-4 sm:p-10">
        {t("hello", { username: userData?.username })}
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
               className="shadow-md hover:shadow-lg rounded-md border border-gray-200"
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
                className="shadow-md hover:shadow-lg rounded-md border border-gray-200 w-[calc(50%-1rem)]"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSeller;
