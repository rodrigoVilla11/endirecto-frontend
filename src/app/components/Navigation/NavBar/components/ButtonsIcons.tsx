"use client";
import React, { useEffect, useState } from "react";
import {
  MdFullscreen,
  MdHome,
  MdNotifications,
  MdNotificationsOff,
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

  // Almacenamos todas las notificaciones sin filtrar
  const [notifications, setNotifications] = useState<any[]>([]);
  const [animateCart, setAnimateCart] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false);

  // Sincroniza el idioma al montar el componente
  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, []);

  const currentUserId = selectedClientId || userQuery.data?._id || "";

  // Ordena las notificaciones usando el campo schedule_from (más recientes primero)
  const sortedNotifications = notifications
    .slice()
    .sort(
      (a, b) =>
        new Date(b.schedule_from).getTime() - new Date(a.schedule_from).getTime()
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

  // Marca todas las notificaciones (todas y no solo las 5)
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

  // Al hacer clic en una notificación, la marca como leída, refetch y redirige
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
      {!isMobile && <MdFullscreen className="cursor-pointer" />}
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
      <div className="relative">
        <MdNotifications
          className="cursor-pointer"
          onClick={() => setIsNotificationsMenuOpen((prev) => !prev)}
        />
        {notifications.filter((n) => !n.read).length > 0 && (
          <span className="absolute top-4 left-3 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {notifications.filter((n) => !n.read).length}
          </span>
        )}
        <AnimatePresence>
          {isNotificationsMenuOpen && (
            <>
              {isMobile ? (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                >
                  <div className="w-[90vw] max-w-md bg-white text-gray-800 shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-primary">
                      <h3 className="font-bold text-lg flex items-center text-white">
                        <Bell className="w-6 h-6 mr-3" />
                        {i18n.t("notifications")}
                      </h3>
                      <button
                        onClick={() => setIsNotificationsMenuOpen(false)}
                        className="text-white hover:text-gray-200 transition-colors focus:outline-none"
                        aria-label="Close notifications"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <AnimatePresence>
                        {sortedNotifications.slice(0, 5).length > 0 ? (
                          <motion.ul className="divide-y divide-gray-100">
                            {sortedNotifications.slice(0, 5).map((notification: any) => (
                              <motion.li
                                key={notification._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className={`p-6 cursor-pointer transition-all duration-200 ease-in-out ${
                                  !notification.read ? "bg-yellow-100" : "hover:bg-gray-50"
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <p className="font-semibold text-gray-800 mb-2 text-xs">
                                  {notification.title}
                                </p>
                                <p className="text-gray-600 text-xs">
                                  {notification.description}
                                </p>
                              </motion.li>
                            ))}
                          </motion.ul>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-12 text-center text-gray-500"
                          >
                            <Bell className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                            <p className="text-xs font-medium">
                              {i18n.t("no_notifications")}
                            </p>
                            <p className="text-xs mt-2 text-gray-400">
                              {i18n.t("notify_notifications")}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="p-6 bg-gray-50">
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs w-full px-6 py-3 bg-primary text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {i18n.t("mark_all_as_read")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-4 w-96 bg-white text-gray-800 shadow-2xl rounded-2xl overflow-hidden z-50 border border-gray-100"
                >
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-primary">
                    <h3 className="font-bold text-lg flex items-center text-white">
                      <Bell className="w-6 h-6 mr-3" />
                      {i18n.t("notifications")}
                    </h3>
                    <button
                      onClick={() => setIsNotificationsMenuOpen(false)}
                      className="text-white hover:text-gray-200 transition-colors focus:outline-none"
                      aria-label="Close notifications"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <AnimatePresence>
                      {sortedNotifications.slice(0, 5).length > 0 ? (
                        <motion.ul className="divide-y divide-gray-100">
                          {sortedNotifications.slice(0, 5).map((notification: any) => (
                            <motion.li
                              key={notification._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2 }}
                              className={`p-6 cursor-pointer transition-all duration-200 ease-in-out ${
                                !notification.read ? "bg-yellow-100" : "hover:bg-gray-50"
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <p className="font-semibold text-gray-800 mb-2 text-xs">
                                {notification.title}
                              </p>
                              <p className="text-gray-600 text-xs">
                                {notification.description}
                              </p>
                            </motion.li>
                          ))}
                        </motion.ul>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-12 text-center text-gray-500"
                        >
                          <Bell className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                          <p className="text-xs font-medium">
                            {i18n.t("no_notifications")}
                          </p>
                          <p className="text-xs mt-2 text-gray-400">
                            {i18n.t("notify_notifications")}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="p-6 bg-gray-50">
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs w-full px-6 py-3 bg-primary text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {i18n.t("mark_all_as_read")}
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
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
