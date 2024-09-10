"use client";
import React from "react";
import Header from "./components/Header";
import Card from "./components/Card";
import { MdOutlineShoppingBag, MdTextSnippet } from "react-icons/md";
import { TbClockExclamation } from "react-icons/tb";
import { FaInfo, FaShoppingBag, FaPowerOff } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { BsCash } from "react-icons/bs";
import { IoIosPaper } from "react-icons/io";
import { IoNotificationsOutline, IoCalculatorSharp } from "react-icons/io5";
import { GoGraph } from "react-icons/go";
import { ImStatsDots } from "react-icons/im";
import CardShortcuts from "./components/CardShortcuts";
import { useSideMenu } from "@/app/context/SideMenuContext";
import Link from "next/link";

const DashboardPage = () => {
  const { isOpen } = useSideMenu();
  const itemsCard = [
    {
      logo: <MdOutlineShoppingBag />,
      title: "Catalogue",
      text: "Access our catalog of articles",
      href: "/catalogue"
    },
    {
      logo: <CgProfile />,
      title: "Select Customer",
      subtitle: "9.999",
      href: "/selectCustomer"
    },
    {
      logo: <MdTextSnippet />,
      title: "Status Account",
      subtitle: "$ 0",
      text: "Expired: $ 0",
      href: "/accounts/status"
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
      href: ""
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
      href: ""
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
      href: ""
    },
    {
      logo: <FaInfo />,
      title: "Pending Reclaims",
      subtitle: "0",
      text: "Total Reclaims: 0",
      href: "/pendings"
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
      href: "/crm"
    },
    {
      logo: <IoIosPaper />,
      title: "Monthly Orders",
      subtitle: "$ 9.999.999",
      text: "Quantity of Orders: 80",
      href: "/orders/orders"
    },
    {
      logo: <IoIosPaper />,
      title: "Monthly Invoices ",
      subtitle: "$ 999.999.999",
      text: "Number of Invoices: 350",
      href: "/accounts/vouchers"
    },
    {
      logo: <IoNotificationsOutline />,
      title: "Notifications",
      subtitle: "0",
      text: "Without reading: 0",
      href: "/notifications"
    },
    {
      logo: <GoGraph />,
      title: "Days of WEB use Clients",
      subtitle: "1.95 %",
      href: ""
    },
  ];
  const itemsShortcuts = [
    { logo: <IoIosPaper />, title: "Documents", href: "/accounts/vouchers" },
    { logo: <BsCash />, title: "Collections", href: "/accounts/payments" },
    { logo: <BsCash />, title: "Collections Summaries", href: "/collections/summaries" },
    { logo: <BsCash />, title: "Collections Unsummaries", href: "/collections/unsummaries" },
    { logo: <IoCalculatorSharp />, title: "Orders", href: "/orders/orders" },
    { logo: <IoCalculatorSharp />, title: "Budget", href: "/orders/budget" },
    { logo: <ImStatsDots />, title: "Statistic", href: "/stats" },
    { logo: <CgProfile />, title: "My Profile", href: "/profile/my-profile" },
    { logo: <FaPowerOff />, title: "Logout", href: "" },
  ];
  return (
    <div className="gap-4">
      <h3 className="text-bold p-4">DASHBOARD</h3>
      <Header />
      <div className={`grid ${!isOpen ? "grid-cols-4" : "grid-cols-3"} pr-4`}>
        {itemsCard.map((item, index: any) => {
          return (
            <Link key={index} href={item.href}>
              <Card
                title={item.title}
                logo={item.logo}
                subtitle={item.subtitle}
                text={item.text}
              />
            </Link>
          );
        })}
      </div>
      <h4 className="text-bold p-4">SHORTCUTS</h4>
      <div className={`grid ${!isOpen ? "grid-cols-4" : "grid-cols-3"} pr-4`}>
        {itemsShortcuts.map((item, index: any) => {
          return (
            <Link key={index} href={item.href}>
              <CardShortcuts title={item.title} logo={item.logo} />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
