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
import { useAuth } from "@/app/context/AuthContext";

const ButtonsIcons = ({ isMobile }: any) => {
  const { selectedClientId } = useClient();
  const { userData } = useAuth();
  const router = useRouter();

  // Si hay un selectedClient, usamos la query para traer sus notificaciones.
  const { data: customer, refetch: refetchCustomer } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { refetchOnMountOrArgChange: true }
  );

  // Estado local para notificaciones (para actualizar el badge y el listado)
  // Si hay selectedClient, usaremos las notificaciones traídas por la API;
  // de lo contrario, se usan las de userData.
  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => {
    if (selectedClientId) {
      if (customer && customer.notifications) {
        setNotifications(customer.notifications);
      }
    } else {
      setNotifications(userData?.notifications || []);
    }
  }, [userData, selectedClientId]);



  const cartItemCount = customer?.shopping_cart
    ? [...new Set(customer.shopping_cart.map((item) => item))].length
    : 0;

  const [animateCart, setAnimateCart] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false);

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
      {/* Icono de notificaciones con badge (cantidad de notificaciones sin leer) */}
      <div className="relative">
        <MdNotifications
          className="cursor-pointer"
          onClick={() => setIsNotificationsMenuOpen((prev) => !prev)}
        />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
        {/* Menú desplegable de notificaciones: muestra solo las no leídas */}
        {isNotificationsMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white text-black shadow-lg rounded-md z-50">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg">{i18n.t("notifications")}</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.filter((n) => !n.read).length > 0 ? (
                <ul>
                  {notifications
                    .filter((notification) => !notification.read)
                    .map((notification: any) => (
                      <li
                        key={notification._id}
                        className="p-4 border-b hover:bg-gray-100 cursor-pointer bg-yellow-100"
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
