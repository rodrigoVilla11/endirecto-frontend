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
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import i18n from "i18next";
import ReactCountryFlag from "react-country-flag";
import { useGetNotificationsPagQuery, useUpdateNotificationMutation } from "@/redux/services/notificationsApi";

const ButtonsIcons = ({ isMobile }: any) => {
  const { selectedClientId } = useClient();

  const { data: customer, refetch: refetchCustomer } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { refetchOnMountOrArgChange: true }
  );

  const router = useRouter();
  const [animateCart, setAnimateCart] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false);

  // Hook para traer las notificaciones (últimas 5) y guardarlas en estado local
  const commonParams = {
    page: 1,
    limit: 5,
    query: "",
    sort: "createdAt:desc",
    customer_id: selectedClientId || "",
  };
  const { data: notificationsData, error, isLoading, refetch } = useGetNotificationsPagQuery(commonParams);

  // Estado local para notificaciones (para poder actualizar el badge y el listado)
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (notificationsData && notificationsData.notifications) {
      setItems(notificationsData.notifications);
    }
  }, [notificationsData]);

  // Mutation para actualizar notificación (cambiar "read")
  const [updateNotification] = useUpdateNotificationMutation();

  // Calcula la cantidad de notificaciones sin leer
  const unreadCount = items.filter((n) => !n.read).length;

  const cartItemCount = customer?.shopping_cart
    ? [...new Set(customer?.shopping_cart.map((item) => item))].length
    : 0;

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      refetchCustomer();
    }
  }, [selectedClientId, refetchCustomer]);

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

  const handleLanguageToggle = () => {
    const newLanguage = currentLanguage === "en" ? "es" : "en";
    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  // Al hacer clic en una notificación: si no está leída, la marca como leída y luego redirige
  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      try {
        const updated = await updateNotification({
          id: notification._id,
          body: { read: true },
        }).unwrap();
        setItems((prev) =>
          prev.map((item) =>
            item._id === notification._id ? { ...item, read: updated.read } : item
          )
        );
      } catch (err) {
        console.error("Error actualizando el estado de read", err);
      }
    }
    setIsNotificationsMenuOpen(false);
    router.push("/notifications");
  };

  return (
    <div className="w-60 flex items-center justify-end gap-4 sm:justify-between text-2xl text-white relative">
      {!isMobile && (
        <MdNotificationsOff className="cursor-pointer text-red-600" />
      )}
      {!isMobile && (
        <button onClick={handleLanguageToggle} className="cursor-pointer text-xl">
          {currentLanguage === "es" ? (
            <ReactCountryFlag
              countryCode="AR"
              svg
              style={{ width: "1em", height: "1em" }}
              title="Argentina"
            />
          ) : (
            <ReactCountryFlag
              countryCode="US"
              svg
              style={{ width: "1em", height: "1em" }}
              title="Estados Unidos"
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
            <span className="absolute top-3 left-3 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </div>
      )}
      {/* Icono de notificaciones con badge de unread */}
      <div className="relative">
        <MdNotifications
          className="cursor-pointer"
          onClick={() => setIsNotificationsMenuOpen((prev) => !prev)}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
        {/* Menú desplegable de notificaciones: se posiciona debajo del icono */}
        {isNotificationsMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white text-black shadow-lg rounded-md z-50">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg">{i18n.t("notifications")}</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items && items.length > 0 ? (
                <ul>
                  {items.map((notification: any) => (
                    <li
                      key={notification._id}
                      className={`p-4 border-b hover:bg-gray-100 cursor-pointer ${
                        !notification.read ? "bg-yellow-100" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <p className="font-semibold">{notification.title}</p>
                      <p className="text-sm">{notification.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4">{i18n.t("no_notifications")}</div>
              )}
            </div>
            <div className="p-4 text-right">
              <button
                onClick={() => setIsNotificationsMenuOpen(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                {i18n.t("close")}
              </button>
            </div>
          </div>
        )}
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
