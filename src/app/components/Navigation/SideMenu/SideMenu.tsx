import React from "react";
import {
  MdDashboard,
  MdOutlineShoppingBag,
  MdWindow,
  MdOutlineMessage,
  MdNotificationsNone,
  MdOutlineInfo,
  MdOutlineQuestionMark,
} from "react-icons/md";
import {
  FaStarOfLife,
  FaRegLightbulb,
  FaDatabase,
  FaPowerOff,
} from "react-icons/fa";
import { BsFire, BsCash } from "react-icons/bs";
import { IoIosLaptop } from "react-icons/io";
import { IoMegaphoneOutline, IoPersonOutline } from "react-icons/io5";
import { CgProfile, CgShoppingCart } from "react-icons/cg";
import { FaRegClock } from "react-icons/fa6";
import { PiDownloadSimpleBold } from "react-icons/pi";
import { ImStatsDots } from "react-icons/im";
import ButtonsIcons from "./components/ButtonsIcons";

const SideMenu = ({isOpen} : any) => {
  const icons = [
    { icon: <MdDashboard />, name: "Dashboard" },
    { icon: <MdOutlineShoppingBag />, name: "Catalogue" },
    { icon: <FaStarOfLife />, name: "Offers" },
    { icon: <BsFire />, name: "Promos" },
    { icon: <FaRegLightbulb />, name: "Nuevos" },
    { icon: <MdWindow />, name: "Kits" },
    {
      icon: <IoIosLaptop />,
      name: "Systems",
      subCategories: [
        "Users",
        "Searches Without Results",
        "Logs",
        "Parameters",
        "Database Tables",
        "Scheduled Task",
      ],
    },
    {
      icon: <FaDatabase />, 
      name: "Data",
      subCategories: [
        "Articles",
        "Brands",
        "Families",
        "Items",
        "Subitems",
        "Files",
        "Applications of Articles",
        "Bank Accounts",
        "Bonifications",
        "Payment Conditions",
        "Stock",
        "Branches",
        "Transports",
        "Sellers",
      ],
    },
    {
      icon: <IoMegaphoneOutline />,
      name: "Marketing",
      subCategories: [
        "Notifications",
        "Publications of Notifications",
        "Banners",
        "Popups",
        "Files",
        "FAQ",
        "Articles",
        "Brands",
        "Families",
        "Items",
        "Subitems",
        "",
        "",
      ],
    },
    { icon: <CgProfile />, name: "Select Customer" },
    {
      icon: <BsCash />,
      name: "Current Accounts",
      subCategories: ["Document Status", "Documents", "Collections"],
    },
    {
      icon: <BsCash />,
      name: "Collections Summaries",
      subCategories: ["Collections Summaries", "Collections Unsummaries"],
    },
    {
      icon: <CgShoppingCart />,
      name: "Orders",
      subCategories: ["Pedidos", "Presupuestos", "Cart"],
    },
    { icon: <MdOutlineMessage />, name: "CRM" },
    { icon: <FaRegClock />, name: "Pendings" },
    { icon: <MdNotificationsNone />, name: "Notifications" },
    {
      icon: <PiDownloadSimpleBold />,
      name: "Downloads",
      subCategories: ["Lists Prices Downloads", "Bonifications Downloads"],
    },
    { icon: <MdOutlineInfo />, name: "Reclaims" },
    { icon: <ImStatsDots />, name: "Statistics" },
    { icon: <MdOutlineQuestionMark />, name: "FAQ" },
    {
      icon: <IoPersonOutline />,
      name: "My Profile",
      subCategories: [
        "My Profile",
        "Customers Users",
        "Brand Margins",
        "Margins By Rubro",
      ],
    },
    { icon: <FaPowerOff />, name: "LogOut" },
  ];
  return (
    <div
    className={`${
      isOpen ? "w-68 items-start px-8 pb-128" : "w-20 items-center pb-112"
    }  bg-header-color absolute top-0 left-0 min-h-full py-24 flex flex-col justify-center gap-6 transition-all duration-1000`}
  >
    {icons.map((icon, index) => (
      <ButtonsIcons key={index} icon={icon} isOpen={isOpen} />
    ))}
  </div>  
  );
};

export default SideMenu;
