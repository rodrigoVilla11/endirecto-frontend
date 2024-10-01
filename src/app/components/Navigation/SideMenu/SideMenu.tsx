import React from "react";
import {
  MdDashboard,
  MdOutlineShoppingBag,
  MdOutlineMessage,
  MdNotificationsNone,
  MdOutlineInfo,
  MdOutlineQuestionMark,
} from "react-icons/md";
import {
  FaDatabase,
  FaHeart,
  FaPowerOff,
} from "react-icons/fa";
import { BsCash } from "react-icons/bs";
import { IoIosLaptop } from "react-icons/io";
import { IoMegaphoneOutline, IoPersonOutline } from "react-icons/io5";
import { CgProfile, CgShoppingCart } from "react-icons/cg";
import { FaRegClock } from "react-icons/fa6";
import { PiDownloadSimpleBold } from "react-icons/pi";
import { ImStatsDots } from "react-icons/im";
import ButtonsIcons from "./components/ButtonsIcons";

const SideMenu = ({isOpen} : any) => {
  const icons = [
    { icon: <MdDashboard />, name: "Dashboard", path: "/dashboard" },
    { icon: <MdOutlineShoppingBag />, name: "Catalogue", path: "/catalogue" },
    {
      icon: <IoIosLaptop />,
      name: "Systems",
      subCategories: [
        { name: "Users", path: "/system/users" },
        { name: "Searches Without Results", path: "/system/searches" },
        // { name: "Logs", path: "/system/logs" },
        // { name: "Parameters", path: "/system/parameters" },
        // { name: "Database Tables", path: "/system/tables" },
        // { name: "Scheduled Task", path: "/system/crons" },

      ],
    },
    {
      icon: <FaDatabase />,
      name: "Data",
      subCategories: [
        { name: "Articles", path: "/data/articles" },
        { name: "Brands", path: "/data/brands" },
        // { name: "Families", path: "/data/families" },
        { name: "Items", path: "/data/items" },
        // { name: "Subitems", path: "/data/subitems" },
        // { name: "Files", path: "/data/files" },
        { name: "Applications of Articles", path: "/data/application-of-articles" },
        // { name: "Bank Accounts", path: "/data/bank-accounts" },
        // { name: "Bonifications", path: "/data/bonifications" },
        { name: "Payment Conditions", path: "/data/payment-conditions" },
        { name: "Stock", path: "/data/stock" },
        { name: "Branches", path: "/data/branches" },
        { name: "Transports", path: "/data/transports" },
        { name: "Sellers", path: "/data/sellers" },
      ],
    },
    {
      icon: <IoMegaphoneOutline />,
      name: "Marketing",
      subCategories: [
        { name: "Notifications", path: "/marketing/notifications" },
        // { name: "Publications of Notifications", path: "/marketing/publications-of-notifications" },
        { name: "Banners", path: "/marketing/banners" },
        { name: "Popups", path: "/marketing/popups" },
        // { name: "Files", path: "/marketing/files" },
        { name: "FAQS", path: "/marketing/faqs" },
        // { name: "Articles", path: "/data/articles" },
        // { name: "Brands", path: "/data/brands" },
        // { name: "Families", path: "/marketing/families" },
        // { name: "Items", path: "/data/items" },
        // { name: "Subitems", path: "/marketing/subitems" },


      ],
    },
    { icon: <CgProfile />, name: "Select Customer", path: "/selectCustomer" },
    {
      icon: <BsCash />,
      name: "Current Accounts",
      subCategories: [
        { name: "Document Status", path: "/accounts/status" },
        { name: "Payments", path: "/accounts/payments" },
        { name: "Vouchers", path: "/accounts/vouchers" },

      ],
    },
    {
      icon: <BsCash />,
      name: "Collections Summaries",
      subCategories: [
        { name: "Collections Summaries", path: "/collections/summaries" },
        { name: "Collections Unsummaries", path: "/collections/unsummaries" },
      ],
    },
    {
      icon: <CgShoppingCart />,
      name: "Orders",
      subCategories: [
        { name: "Pedidos", path: "/orders/orders" },
        { name: "Presupuestos", path: "/orders/budgets" },
        { name: "Cart", path: "/orders/cart" },
      ],
    },
    { icon: <MdOutlineMessage />, name: "CRM", path: "/crm" },
    { icon: <FaHeart />, name: "Favourites", path: "/favourites" },
    // { icon: <FaRegClock />, name: "Pendings", path: "/pendings" },
    { icon: <MdNotificationsNone />, name: "Notifications", path: "/notifications" },
    {
      icon: <PiDownloadSimpleBold />,
      name: "Downloads",
      subCategories: [
        { name: "Lists Prices Downloads", path: "/downloads/prices-lists" },
        { name: "Bonifications Downloads", path: "/downloads/articles-bonuses" },
      ],
    },
    { icon: <MdOutlineInfo />, name: "Reclaims", path: "/reclaims" },
    { icon: <ImStatsDots />, name: "Statistics", path: "/statistics" },
    { icon: <MdOutlineQuestionMark />, name: "FAQ", path: "/faqs" },
    {
      icon: <IoPersonOutline />,
      name: "My Profile",
      subCategories: [
        { name: "My Profile", path: "/profile/my-profile" },
        { name: "Customers Users", path: "/profile/customers-users" },
        { name: "Brand Margins", path: "/profile/brands-margin" },
        { name: "Item Margins", path: "/profile/items-margin" },
      ],
    },
    { icon: <FaPowerOff />, name: "LogOut", path: "/logout" },
  ];
  return (
    <div
    className={`${
      isOpen ? "w-68 items-start px-8" : "w-20 items-center"
    }  bg-header-color absolute top-0 left-0 min-h-full py-24 flex flex-col justify-center gap-6 transition-all duration-1000`}
  >
    {icons.map((icon:any, index: any) => (
      <ButtonsIcons key={index} icon={icon} isOpen={isOpen} />
    ))}
  </div>  
  );
};

export default SideMenu;
