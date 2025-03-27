"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "./components/Header";
import Card from "./components/Card";
import CardShortcuts from "./components/CardShortcuts";

// Íconos
import { MdOutlineShoppingBag, MdTextSnippet } from "react-icons/md";
import { FaPowerOff, FaShoppingCart, FaPhone, FaFileDownload } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { BsCash } from "react-icons/bs";
import { IoIosPaper } from "react-icons/io";
import { IoNotificationsOutline, IoCalculatorSharp } from "react-icons/io5";
import { ImStatsDots } from "react-icons/im";

// Contextos y hooks
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";

// Queries
import {
  useGetCustomerByIdQuery,
  useGetCustomersPagQuery,
} from "@/redux/services/customersApi";
import { useGetBalancesSummaryQuery } from "@/redux/services/customersInformations";
import { useGetMonthlySalesQuery } from "@/redux/services/ordersApi";
import { useGetMonthlyInvoicesQuery } from "@/redux/services/documentsApi";
import { useGetUserByIdQuery } from "@/redux/services/usersApi";

import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const DashboardPage = () => {
  // ------------------ Hooks y Contextos ------------------
  const { t } = useTranslation();
  const { isOpen } = useSideMenu();
  const { selectedClientId } = useClient();
  const { role, userData } = useAuth();

  const { data, error, isLoading, refetch } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const userQuery = useGetUserByIdQuery({ id: userData?._id || "" });

  // ------------------ Filtro de vendedor ------------------
  const [sellerFilter, setSellerFilter] = useState("");
  useEffect(() => {
    if (role === "VENDEDOR" && userData?.seller_id) {
      setSellerFilter(userData.seller_id);
    }
  }, [role, userData]);

  // ------------------ Query Params ------------------
  const queryParams =
    selectedClientId && selectedClientId !== ""
      ? { customerId: selectedClientId }
      : userData?.role === "VENDEDOR"
      ? { sellerId: userData.seller_id }
      : {};

  const { data: totalCustomers } = useGetCustomersPagQuery({
    page: 1,
    limit: ITEMS_PER_PAGE,
    seller_id: sellerFilter,
  });

  const { data: totalDebt } = useGetBalancesSummaryQuery(queryParams);

  // ------------------ Funciones de Formateo ------------------
  const formatPriceWithCurrency = (price: any) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(price)
      .replace("ARS", "")
      .trim();

  const formatCurrency = (value: any) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // ------------------ Lógica para Ventas y Facturación ------------------
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // Mes 1-12
  const lastYear = currentYear - 1;
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  // Ventas mensuales del año actual y pasado
  const { data: currentYearSalesData } = useGetMonthlySalesQuery({
    startDate: `${currentYear}-01-01`,
    endDate: `${currentYear}-12-31`,
    ...queryParams,
  });
  const { data: lastYearSalesData } = useGetMonthlySalesQuery({
    startDate: `${lastYear}-01-01`,
    endDate: `${lastYear}-12-31`,
    ...queryParams,
  });

  // Facturación mensual (facturas) del año actual
  const { data: currentYearInvoicesData } = useGetMonthlyInvoicesQuery({
    startDate: `${currentYear}-${currentMonth}-01`,
    endDate: `${currentYear}-${currentMonth}-31`,
    ...queryParams,
  });

  // Extraer datos específicos para ventas e ingresos
  const currentMonthSalesData = currentYearSalesData?.find(
    (d) => d.month === currentMonth
  );
  const lastYearSameMonthSalesData = lastYearSalesData?.find(
    (d) => d.month === currentMonth
  );
  const previousMonthSalesData =
    currentMonth === 1
      ? lastYearSalesData?.find((d) => d.month === 12)
      : currentYearSalesData?.find((d) => d.month === previousMonth);

  const currentMonthInvoiceData = currentYearInvoicesData?.find(
    (d) => d.month === currentMonth
  );

  // Cálculo de porcentajes
  const interannualPercentage =
    lastYearSameMonthSalesData?.totalSales && currentMonthSalesData?.totalSales
      ? (currentMonthSalesData.totalSales / lastYearSameMonthSalesData.totalSales) *
        100
      : 0;

  const monthlyPercentage =
    previousMonthSalesData?.totalSales && currentMonthSalesData?.totalSales
      ? (currentMonthSalesData.totalSales / previousMonthSalesData.totalSales) *
        100
      : 0;

  const currentMonthOrdersTotal = currentMonthSalesData?.totalSales || 0;
  const currentMonthOrdersCount = currentMonthSalesData?.countOrders || 0;
  const currentMonthInvoiceTotal = currentMonthInvoiceData?.totalSales || 0;
  const currentMonthInvoiceCount = currentMonthInvoiceData?.totalQty || 0;

  // ------------------ Definición de Items para Cards ------------------
  /** Tipo de Item para Card */
  interface CardItem {
    logo: React.ReactNode;
    title: any;
    subtitle?: any;
    text?: any;
    href: string;
    allowedRoles: string[];
    color?: string;
    className?: string;
    logout?: boolean;
  }

  const itemsCard: CardItem[] = [
    {
      logo: <MdOutlineShoppingBag />,
      title: t("catalogue"),
      text: t("accessCatalog"),
      href: "/catalogue",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"],
    },
    {
      logo: <CgProfile />,
      title: t("selectCustomer"),
      subtitle: totalCustomers?.totalCustomers,
      href: "/selectCustomer",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"],
    },
    {
      logo: (
        <MdTextSnippet
          className={`${totalDebt?.documents_balance ? "text-red-500" : ""}`}
        />
      ),
      title: t("statusAccount"),
      subtitle: `${formatPriceWithCurrency(totalDebt?.documents_balance)}`,
      text: `${t("expired")}: ${formatPriceWithCurrency(
        totalDebt?.documents_balance_expired
      )}`,
      href: "/accounts/status",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"],
      color: totalDebt?.documents_balance ? "red" : "",
    },
    // Venta interanual
    {
      logo: (
        <BsCash
          className={
            interannualPercentage < 80
              ? "text-red-500"
              : interannualPercentage < 100
              ? "text-yellow-500"
              : "text-green-500"
          }
        />
      ),
      title: t("interannualSell"),
      subtitle: `${interannualPercentage.toFixed(0)}%`,
      text: (
        <>
          {t("currentMonth")}: {formatCurrency(currentMonthSalesData?.totalSales || 0)}
          <br />
          {t("lastYearMonth")}: {formatCurrency(lastYearSameMonthSalesData?.totalSales || 0)}
        </>
      ),
      href: "",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
      color:
        interannualPercentage < 80
          ? "red"
          : interannualPercentage < 100
          ? "yellow"
          : "green",
    },
    // Venta mensual
    {
      logo: (
        <BsCash
          className={
            monthlyPercentage < 80
              ? "text-red-500"
              : monthlyPercentage < 100
              ? "text-yellow-500"
              : "text-green-500"
          }
        />
      ),
      title: t("monthlySell"),
      subtitle: `${monthlyPercentage.toFixed(0)}%`,
      text: (
        <>
          {t("currentMonth")}: {formatCurrency(currentMonthSalesData?.totalSales || 0)}
          <br />
          {t("lastMonth")}: {formatCurrency(previousMonthSalesData?.totalSales || 0)}
        </>
      ),
      href: "/orders/orders",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
      color:
        monthlyPercentage < 80
          ? "red"
          : monthlyPercentage < 100
          ? "yellow"
          : "green",
    },
    // Pedidos mensuales
    {
      logo: <IoIosPaper />,
      title: t("monthlyOrders"),
      subtitle: formatCurrency(currentMonthOrdersTotal),
      text: `${t("quantityOrders")}: ${currentMonthOrdersCount}`,
      href: "/orders/orders",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    // Facturación mensual
    {
      logo: <IoIosPaper />,
      title: t("monthlyInvoices"),
      subtitle: formatCurrency(currentMonthInvoiceTotal),
      text: `${t("numberInvoices")}: ${currentMonthInvoiceCount}`,
      href: "/accounts/vouchers",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    // Notificaciones
    {
      logo: (
        <IoNotificationsOutline
          className={
            ((selectedClientId
              ? data?.notifications.filter((n: any) => !n.read).length
              : userQuery.data?.notifications.filter((n: any) => !n.read).length) || 0) > 0
              ? "text-red-500"
              : "text-green-500"
          }
        />
      ),
      title: t("notifications"),
      subtitle: selectedClientId
        ? data?.notifications.length
        : userQuery.data?.notifications.length,
      text: `${t("unreadNotifications")}: ${
        (selectedClientId
          ? data?.notifications.filter((n: any) => !n.read).length
          : userQuery.data?.notifications.filter((n: any) => !n.read).length) || 0
      }`,
      href: "/notifications",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"],
      color:
        ((selectedClientId
          ? data?.notifications.filter((n: any) => !n.read).length
          : userQuery.data?.notifications.filter((n: any) => !n.read).length) ||
          0) > 0
          ? "red"
          : "green",
    },
  ];

  // ------------------ Definición de Items para Shortcuts ------------------
  const itemsShortcuts: CardItem[] = [
    {
      logo: <IoIosPaper />,
      title: t("documents"),
      href: "/accounts/vouchers",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"],
    },
    {
      logo: <BsCash />,
      title: t("collections"),
      href: "/accounts/payments",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"],
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
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"],
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
      href: "/statistics",
      allowedRoles: ["ADMINISTRADOR", "VENDEDOR"],
    },
    {
      logo: <CgProfile />,
      title: t("myProfile"),
      href: "/profile/my-profile",
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"],
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
      allowedRoles: ["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"],
      logout: true,
    },
  ];

  // ------------------ Filtrado según roles ------------------
  const filteredItemsCard = role
    ? itemsCard.filter(
        (item) => !item.allowedRoles || item.allowedRoles.includes(role)
      )
    : itemsCard;

  const filteredItemsShortcuts = role
    ? itemsShortcuts.filter(
        (item) => !item.allowedRoles || item.allowedRoles.includes(role)
      )
    : itemsShortcuts;

  // ------------------ Renderizado ------------------
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
                className="shadow-md hover:shadow-lg rounded-md border border-gray-200"
                color={item.color}
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
                className="shadow-md hover:shadow-lg rounded-md border border-gray-200"
                logout={item.logout}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
