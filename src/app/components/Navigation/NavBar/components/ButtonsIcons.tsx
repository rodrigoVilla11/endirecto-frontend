import React, { useEffect, useRef, useState } from "react";
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

  const { data: userQueryData, refetch: refetchUser } = useGetUserByIdQuery(
    { id: userData?._id || "" },
    { skip: !userData?._id }
  );

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
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentLanguage(i18n.language);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const currentUserId =
    selectedClientId || userData?._id || userQueryData?._id || "";
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
    } else if (!selectedClientId && userQueryData?.notifications) {
      setNotifications(userQueryData.notifications);
    } else {
      setNotifications([]);
    }
  }, [customer, userQueryData, selectedClientId]);

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
    if (notification.read || !currentUserId) return;

    try {
      if (selectedClientId) {
        // CLIENTE
        await markNotificationCustomerAsRead({
          id: currentUserId,
          notificationId: notification._id,
        }).unwrap();
      } else {
        // USUARIO (ANITA / ADMIN / VENDEDOR / etc.)
        await markNotificationAsRead({
          id: currentUserId,
          notificationId: notification._id,
        }).unwrap();
      }

      // Actualizar en memoria para que se vea al toque
      setNotifications((prev) =>
        prev.map((n) =>
          String(n._id) === String(notification._id) ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error("Error al marcar notificación como leída", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return;

    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) {
      setIsNotificationsMenuOpen(false);
      return;
    }

    // Marcamos todas en backend
    for (const notification of unread) {
      await handleMarkAsRead(notification);
    }

    // Refetch por las dudas (sincronizar con back)
    if (selectedClientId) {
      await refetchCustomer();
    } else {
      await refetchUser();
    }

    setIsNotificationsMenuOpen(false);
  };

  const handleNotificationClick = async (notification: any) => {
    await handleMarkAsRead(notification);
    if (selectedClientId) {
      await refetchCustomer();
    } else {
      await refetchUser();
    }
    setIsNotificationsMenuOpen(false);
    handleRedirect("/notifications");
  };

  useEffect(() => {
    if (!isNotificationsMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsMenuOpen]);

  return (
    <div
      className={`flex items-center ${
        isMobile ? "gap-2" : "gap-4 w-60 justify-evenly"
      } text-xl sm:text-2xl text-white relative`}
    >
      {!isMobile && (
        <button
          onClick={handleLanguageToggle}
          className="cursor-pointer hover:scale-110 transition-transform"
        >
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
          className="cursor-pointer hover:scale-110 transition-transform"
          onClick={toggleFullscreen}
          title={
            isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"
          }
        />
      )}
      {selectedClientId && (
        <div className="relative">
          <MdShoppingCart
            className={`cursor-pointer hover:scale-110 transition-transform ${
              animateCart ? "animate-bounce" : ""
            }`}
            onClick={() => handleRedirect("/shopping-cart")}
          />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold shadow-lg">
              {cartItemCount}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <MdNotifications
          className="cursor-pointer hover:scale-110 transition-transform"
          onClick={() => setIsNotificationsMenuOpen((prev) => !prev)}
        />
        {notifications.filter((n) => !n.read).length > 0 && (
          <span
            onClick={() => setIsNotificationsMenuOpen((prev) => !prev)}
            className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse"
          >
            {notifications.filter((n) => !n.read).length}
          </span>
        )}
        <AnimatePresence>
          {isNotificationsMenuOpen && (
            <>
              {isMobile ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                  onClick={() => setIsNotificationsMenuOpen(false)}
                >
                  <motion.div
                    ref={notifRef}
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-[90vw] max-w-md bg-white text-gray-800 shadow-2xl rounded-3xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header con gradiente */}
                    <div className="p-6 flex justify-between items-center bg-gradient-to-r from-red-500 via-white to-blue-500">
                      <h3 className="font-bold text-xl flex items-center text-black">
                        <Bell className="w-6 h-6 mr-3" />
                        {i18n.t("notifications")}
                      </h3>
                      <button
                        onClick={() => setIsNotificationsMenuOpen(false)}
                        className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        aria-label="Close notifications"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Contenido de notificaciones */}
                    <div className="max-h-96 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
                      <AnimatePresence>
                        {sortedNotifications.slice(0, 5).length > 0 ? (
                          <motion.ul className="divide-y divide-gray-200">
                            {sortedNotifications
                              .slice(0, 5)
                              .map((notification: any, index: number) => (
                                <motion.li
                                  key={notification._id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{
                                    duration: 0.2,
                                    delay: index * 0.05,
                                  }}
                                  className={`p-5 cursor-pointer transition-all duration-200 ${
                                    !notification.read
                                      ? "bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-l-4 border-orange-400"
                                      : "hover:bg-gray-100"
                                  }`}
                                  onClick={() =>
                                    handleNotificationClick(notification)
                                  }
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`mt-1 p-2 rounded-full ${
                                        !notification.read
                                          ? "bg-orange-500"
                                          : "bg-gray-300"
                                      }`}
                                    >
                                      <Bell
                                        className={`w-4 h-4 ${
                                          !notification.read
                                            ? "text-white"
                                            : "text-gray-600"
                                        }`}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-gray-900 mb-1 text-sm">
                                        {notification.title}
                                      </p>
                                      <p className="text-gray-600 text-xs leading-relaxed break-words line-clamp-3">
                                        {notification.description}
                                      </p>
                                      {!notification.read && (
                                        <span className="inline-block mt-2 text-[10px] px-2 py-1 bg-orange-500 text-white rounded-full font-bold">
                                          NUEVA
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </motion.li>
                              ))}
                          </motion.ul>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-12 text-center"
                          >
                            <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                              <Bell className="w-12 h-12 text-gray-400" />
                            </div>
                            <p className="text-sm font-bold text-gray-700 mb-2">
                              {i18n.t("no_notifications")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {i18n.t("notify_notifications")}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Footer con botón */}
                    {sortedNotifications.length > 0 && (
                      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-t-2 border-gray-200">
                        <button
                          onClick={handleMarkAllAsRead}
                          className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center font-bold text-sm"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          {i18n.t("mark_all_as_read")}
                        </button>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  ref={notifRef}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-4 w-96 bg-white text-gray-800 shadow-2xl rounded-3xl overflow-hidden z-50 border-2 border-gray-200"
                >
                  {/* Header con gradiente */}
                  <div className="p-6 flex justify-between items-center bg-gradient-to-r from-red-500 via-white to-blue-500">
                    <h3 className="font-bold text-xl flex items-center text-white">
                      <Bell className="w-6 h-6 mr-3" />
                      {i18n.t("notifications")}
                    </h3>
                    <button
                      onClick={() => setIsNotificationsMenuOpen(false)}
                      className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                      aria-label="Close notifications"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Contenido de notificaciones */}
                  <div className="max-h-96 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
                    <AnimatePresence>
                      {sortedNotifications.slice(0, 5).length > 0 ? (
                        <motion.ul className="divide-y divide-gray-200">
                          {sortedNotifications
                            .slice(0, 5)
                            .map((notification: any, index: number) => (
                              <motion.li
                                key={notification._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{
                                  duration: 0.2,
                                  delay: index * 0.05,
                                }}
                                className={`p-5 cursor-pointer transition-all duration-200 ${
                                  !notification.read
                                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-l-4 border-orange-400"
                                    : "hover:bg-gray-100"
                                }`}
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`mt-1 p-2 rounded-full ${
                                      !notification.read
                                        ? "bg-orange-500"
                                        : "bg-gray-300"
                                    }`}
                                  >
                                    <Bell
                                      className={`w-4 h-4 ${
                                        !notification.read
                                          ? "text-white"
                                          : "text-gray-600"
                                      }`}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 mb-1 text-sm">
                                      {notification.title}
                                    </p>
                                    <p className="text-gray-600 text-xs leading-relaxed break-words line-clamp-3">
                                      {notification.description}
                                    </p>
                                    {!notification.read && (
                                      <span className="inline-block mt-2 text-[10px] px-2 py-1 bg-orange-500 text-white rounded-full font-bold">
                                        NUEVA
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.li>
                            ))}
                        </motion.ul>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-12 text-center"
                        >
                          <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                            <Bell className="w-12 h-12 text-gray-400" />
                          </div>
                          <p className="text-sm font-bold text-gray-700 mb-2">
                            {i18n.t("no_notifications")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {i18n.t("notify_notifications")}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer con botón */}
                  {sortedNotifications.length > 0 && (
                    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-t-2 border-gray-200">
                      <button
                        onClick={handleMarkAllAsRead}
                        className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center font-bold text-sm"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {i18n.t("mark_all_as_read")}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
      {!isMobile && (
        <MdHome
          onClick={() => handleRedirect("/")}
          className="cursor-pointer hover:scale-110 transition-transform"
        />
      )}
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
