import React from "react";
import { GiUsaFlag } from "react-icons/gi";
import {
  MdFullscreen,
  MdHome,
  MdNotifications,
  MdNotificationsOff,
  MdShoppingCart,
} from "react-icons/md";
import { useRouter } from "next/navigation";

const ButtonsIcons = () => {
  const router = useRouter();
  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };
  return (
    <div className="w-60 flex items-center justify-between text-2xl text-white">
      <MdNotificationsOff className="cursor-pointer text-red-600" />
      <GiUsaFlag className="cursor-pointer" />
      <MdFullscreen className="cursor-pointer" />
      <MdShoppingCart 
      className="cursor-pointer" 
      onClick={() => handleRedirect("/shopping-cart")}
      />
      <MdNotifications className="cursor-pointer" />
      <MdHome
        onClick={() => handleRedirect("/")}
        className="cursor-pointer"
      />
    </div>
  );
};

export default ButtonsIcons;
