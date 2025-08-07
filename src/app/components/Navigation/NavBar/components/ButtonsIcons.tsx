import React, { useEffect, useState } from "react";
import {
  MdFullscreen,
  MdHome,
  MdNotifications,
  MdShoppingCart,
} from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useClient } from "@/app/context/ClientContext";
import {
  useGetCustomerByIdQuery,
  useMarkNotificationAsReadCustomerMutation,
} from "@/redux/services/customersApi";
import i18n from "i18next";
import ReactCountryFlag from "react-country-flag";
import { useAuth } from "@/app/context/AuthContext";
import {
  useGetUserByIdQuery,
  useMarkNotificationAsReadMutation,
} from "@/redux/services/usersApi";
import { Bell, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ButtonsIcons = ({ isMobile }: { isMobile?: boolean }) => {
  const { selectedClientId } = useClient();
  const { userData } = useAuth();
  const router = useRouter();

  const userQuery = useGetUserByIdQuery({ id: userData?._id || "" });

  const { data: customer, refetch: refetchCustomer } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId, refetchOnMountOrArgChange: true }
  );

  const [notifications, setNotifications] = useState<any[]>([]);
  const [animateCart, setAnimateCart] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setCurrentLanguage(i18n.language);

    // Detectar cambios en fullscreen
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const currentUserId = selectedClientId || userQuery.data?._id || "";
  const sortedNotifications = notifications
    .slice()
    .sort(
      (a, b) =>
        new Date(b.schedule_from).getTime() -
        new Date(a.schedule_from).getTime()
    );

  const cartItemCount = customer?.shopping_cart
    ? new Set(customer.shopping_cart).size
    : 0;

  useEffect(() => {
    if (selectedClientId && customer?.notifications) {
      setNotifications(customer.notifications);
    } else if (!selectedClientId && userQuery.data?.notifications) {
      setNotifications(userQuery.data?.notifications);
    } else {
      setNotifications([]);
    }
  }, [userQuery, customer, selectedClientId]);

  useEffect(() => {
    if (cartItemCount > 0) {
      setAnimateCart(true);
      setShowTick(true);
      const cartTimer = setTimeout(() => setAnimateCart(false), 500);
      const tickTimer = setTimeout(() => setShowTick(false), 1000);
      return () => {
        clearTimeout(cartTimer);
        clearTimeout(tickTimer);
      };
    }
  }, [cartItemCount]);

  const handleRedirect = (path: string) => {
    router.push(path);
  };

  const handleLanguageToggle = () => {
    const newLanguage = currentLanguage === "en" ? "es" : "en";
    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error al entrar en pantalla completa:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error al salir de pantalla completa:", err);
      });
    }
  };

  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [markNotificationCustomerAsRead] =
    useMarkNotificationAsReadCustomerMutation();

  const handleMarkAsRead = async (notification: any) => {
    if (!notification.read && currentUserId) {
      try {
        if (selectedClientId) {
          await markNotificationCustomerAsRead({
            id: currentUserId,
            notificationId: notification._id,
          }).unwrap();
        } else {
          await markNotificationAsRead({
            id: currentUserId,
            title: notification.title,
          }).unwrap();
        }
      } catch (err) {
        console.error("Error al marcar notificación como leída", err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    for (const notification of notifications) {
      if (!notification.read) {
        await handleMarkAsRead(notification);
      }
    }
    if (selectedClientId) {
      await refetchCustomer();
    } else {
      await userQuery.refetch();
    }
    setIsNotificationsMenuOpen(false);
  };

  const handleNotificationClick = async (notification: any) => {
    await handleMarkAsRead(notification);
    if (selectedClientId) {
      await refetchCustomer();
    } else {
      await userQuery.refetch();
    }
    setIsNotificationsMenuOpen(false);
    handleRedirect("/notifications");
  };

  return (
    <div className="w-60 flex items-center justify-end gap-4 sm:justify-evenly text-2xl text-white relative">
      {!isMobile && (
        <button onClick={handleLanguageToggle} className="cursor-pointer">
          {currentLanguage === "en" ? (
            <ReactCountryFlag
              countryCode="US"
              svg
              style={{ width: "1em", height: "1em" }}
              title="Estados Unidos"
            />
          ) : (
            <ReactCountryFlag
              countryCode="AR"
              svg
              style={{ width: "1em", height: "1em" }}
              title="Argentina"
            />
          )}
        </button>
      )}
      {!isMobile && (
        <MdFullscreen
          className="cursor-pointer"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        />
      )}
      {selectedClientId && (
        <div className="relative">
          <MdShoppingCart
            className={`cursor-pointer ${animateCart ? "animate-bounce" : ""}`}
            onClick={() => handleRedirect("/shopping-cart")}
          />
          {cartItemCount > 0 && (
            <span className="absolute top-4 left-3 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </div>
      )}
      {/* ... resto del código igual */}
      <MdHome onClick={() => handleRedirect("/")} className="cursor-pointer" />
      {showTick && (
        <div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-500 text-5xl animate-pulse"
          style={{ zIndex: 9999 }}
        >
          <FaCheckCircle />
        </div>
      )}
    </div>
  );
};

export default ButtonsIcons;
